import { Booking, IBooking } from '../../infrastructure/database/models/Booking';
import { Quotation } from '../../infrastructure/database/models/Quotation';
import { Shipment } from '../../infrastructure/database/models/Shipment';
import { Vehicle } from '../../infrastructure/database/models/Vehicle';
import { Notification } from '../../infrastructure/database/models/Notification';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';
import {
  BookingStatus,
  MilestoneType,
  PaymentStatus,
  QuotationStatus,
  ShipmentStatus,
  UserRole
} from '@loadvanta/contracts';
import { Types } from 'mongoose';

export class BookingService {
  async confirmBooking(
    quotationId: string,
    shipperId: string
  ): Promise<IBooking> {
    // 1. Fetch quotation with shipment and vehicle
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      const err: any = new Error('Quotation not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (quotation.status !== QuotationStatus.SUBMITTED) {
      const err: any = new Error(`Cannot confirm booking for quotation with status: ${quotation.status}`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    // 2. Fetch shipment and verify ownership
    const shipment = await Shipment.findById(quotation.shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (shipment.shipperId.toString() !== shipperId) {
      const err: any = new Error('Unauthorized: You are not the owner of this shipment.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    if (shipment.activeBookingId) {
      const err: any = new Error('This shipment already has an active booking.');
      err.statusCode = 409;
      err.isOperational = true;
      throw err;
    }

    // 3. Check vehicle availability and prevent double-booking
    const vehicle = await Vehicle.findById(quotation.vehicleId);
    if (!vehicle) {
      const err: any = new Error('Vehicle assigned to this quotation is no longer found.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    if (!vehicle.isAvailable || vehicle.activeBookingId) {
      const err: any = new Error(
        `Vehicle ${vehicle.registrationNumber} is currently committed to another active journey and unavailable.`
      );
      err.statusCode = 409;
      err.isOperational = true;
      throw err;
    }

    // 4. Generate unique Booking Number
    const count = await Booking.countDocuments();
    const bookingNumber = `LV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 5. Create Booking
    const booking = await Booking.create({
      bookingNumber,
      shipmentId: shipment._id,
      shipperId: shipment.shipperId,
      transporterId: quotation.transporterId,
      vehicleId: quotation.vehicleId,
      quotationId: quotation._id,
      agreedPriceInr: quotation.proposedPriceInr,
      platformFeeInr: Math.round(quotation.proposedPriceInr * 0.02), // 2% platform fee
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      scheduledPickupDate: quotation.estimatedPickupDate,
      scheduledDeliveryDate: quotation.estimatedDeliveryDate,
      milestones: [
        {
          type: MilestoneType.BOOKED,
          title: 'Booking Confirmed',
          description: `Booking confirmed with agreed freight ₹${quotation.proposedPriceInr.toLocaleString('en-IN')}`,
          location: shipment.pickupCity,
          timestamp: new Date(),
          updatedBy: new Types.ObjectId(shipperId)
        }
      ]
    });

    // 6. Atomically lock vehicle
    vehicle.isAvailable = false;
    vehicle.activeBookingId = booking._id as any;
    await vehicle.save();

    // 7. Update Quotations (mark this ACCEPTED, others on same shipment REJECTED)
    quotation.status = QuotationStatus.ACCEPTED;
    await quotation.save();

    await Quotation.updateMany(
      {
        shipmentId: shipment._id,
        _id: { $ne: quotation._id },
        status: QuotationStatus.SUBMITTED
      },
      {
        $set: { status: QuotationStatus.REJECTED }
      }
    );

    // 8. Update Shipment
    shipment.status = ShipmentStatus.BOOKING_CONFIRMED;
    shipment.selectedQuotationId = quotation._id as any;
    shipment.activeBookingId = booking._id as any;
    await shipment.save();

    // 9. Notify Transporter
    await Notification.create({
      userId: quotation.transporterId,
      title: 'Quotation Accepted! Booking Confirmed',
      message: `Your quotation for load '${shipment.title}' was accepted. Booking ID: ${bookingNumber}`,
      type: 'BOOKING',
      link: `/dashboard/transporter?bookingId=${booking._id}`
    });

    // 10. Audit Log
    await AuditLog.create({
      actorId: new Types.ObjectId(shipperId),
      action: 'BOOKING_CONFIRMED',
      targetEntity: 'Booking',
      targetId: booking._id.toString(),
      metadata: { bookingNumber, vehicleId: vehicle._id }
    });

    return booking;
  }

  async addMilestone(
    bookingId: string,
    userId: string,
    data: {
      type: MilestoneType;
      title: string;
      description?: string;
      location?: string;
    }
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    // Verify user is authorized (transporter or admin)
    if (booking.transporterId.toString() !== userId) {
      const err: any = new Error('Unauthorized to update milestones for this booking.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    // Append milestone
    booking.milestones.push({
      type: data.type,
      title: data.title || data.type.replace(/_/g, ' '),
      description: data.description,
      location: data.location,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(userId)
    });

    // Update statuses based on milestone
    if (
      data.type === MilestoneType.TRUCK_DISPATCHED ||
      data.type === MilestoneType.LOADED_IN_TRANSIT ||
      data.type === MilestoneType.ARRIVED_PICKUP
    ) {
      booking.status = BookingStatus.IN_TRANSIT;
      await Shipment.findByIdAndUpdate(booking.shipmentId, { status: ShipmentStatus.IN_TRANSIT });
    } else if (data.type === MilestoneType.DELIVERED) {
      booking.status = BookingStatus.DELIVERED;
      booking.actualDeliveryDate = new Date();
      await Shipment.findByIdAndUpdate(booking.shipmentId, { status: ShipmentStatus.DELIVERED });
    } else if (data.type === MilestoneType.COMPLETED) {
      booking.status = BookingStatus.COMPLETED;
      await Shipment.findByIdAndUpdate(booking.shipmentId, { status: ShipmentStatus.COMPLETED });

      // Release vehicle back into available fleet
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        isAvailable: true,
        activeBookingId: null,
        currentCity: data.location || undefined
      });
    }

    await booking.save();

    // Notify shipper of milestone update
    await Notification.create({
      userId: booking.shipperId,
      title: `Trip Update: ${data.title}`,
      message: `Booking ${booking.bookingNumber}: ${data.title} ${data.location ? `at ${data.location}` : ''}`,
      type: 'TRIP_UPDATE',
      link: `/dashboard/shipper?bookingId=${booking._id}`
    });

    return booking;
  }

  async uploadDeliveryProof(
    bookingId: string,
    transporterId: string,
    data: { documentUrl: string; receiverName?: string; notes?: string }
  ): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new Types.ObjectId(bookingId),
      transporterId: new Types.ObjectId(transporterId)
    });

    if (!booking) {
      const err: any = new Error('Booking not found or unauthorized.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    booking.deliveryProof = {
      documentUrl: data.documentUrl,
      uploadedAt: new Date(),
      receiverName: data.receiverName,
      notes: data.notes
    };

    booking.milestones.push({
      type: MilestoneType.POD_SUBMITTED,
      title: 'Proof of Delivery (POD) Uploaded',
      description: `Receiver: ${data.receiverName || 'Consignee'}`,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(transporterId)
    });

    await booking.save();

    await Notification.create({
      userId: booking.shipperId,
      title: 'Proof of Delivery Uploaded',
      message: `Transporter has submitted the delivery proof for booking ${booking.bookingNumber}.`,
      type: 'DELIVERY_PROOF',
      link: `/dashboard/shipper?bookingId=${booking._id}`
    });

    return booking;
  }

  async getMyBookings(userId: string, role: UserRole): Promise<IBooking[]> {
    const query = role === UserRole.TRANSPORTER ? { transporterId: new Types.ObjectId(userId) } : { shipperId: new Types.ObjectId(userId) };

    return Booking.find(query)
      .populate('shipmentId')
      .populate('vehicleId')
      .populate('transporterId', 'fullName companyName phone city')
      .populate('shipperId', 'fullName companyName phone city')
      .sort({ createdAt: -1 });
  }

  async getBookingById(bookingId: string, userId: string, role: UserRole): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId)
      .populate('shipmentId')
      .populate('vehicleId')
      .populate('transporterId', 'fullName companyName phone city')
      .populate('shipperId', 'fullName companyName phone city');

    if (!booking) return null;

    if (
      role !== UserRole.ADMIN &&
      booking.shipperId._id.toString() !== userId &&
      booking.transporterId._id.toString() !== userId
    ) {
      const err: any = new Error('Access denied to booking.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    return booking;
  }
}

export const bookingService = new BookingService();
