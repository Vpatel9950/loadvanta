import { Quotation, IQuotation } from '../../infrastructure/database/models/Quotation';
import { Shipment } from '../../infrastructure/database/models/Shipment';
import { Vehicle } from '../../infrastructure/database/models/Vehicle';
import { QuotationStatus, ShipmentStatus } from '@loadvanta/contracts';
import { Types } from 'mongoose';
import { Notification } from '../../infrastructure/database/models/Notification';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';

export class QuotationService {
  async submitQuotation(
    transporterId: string,
    data: {
      shipmentId: string;
      vehicleId: string;
      proposedPriceInr: number;
      estimatedPickupDate: Date;
      estimatedDeliveryDate: Date;
      comments?: string;
    }
  ): Promise<IQuotation> {
    // 1. Validate shipment
    const shipment = await Shipment.findById(data.shipmentId);
    if (!shipment) {
      const err: any = new Error('Shipment not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (
      shipment.status !== ShipmentStatus.PUBLISHED &&
      shipment.status !== ShipmentStatus.QUOTATION_RECEIVED
    ) {
      const err: any = new Error(`Cannot quote on shipment with status: ${shipment.status}`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    // 2. Validate vehicle belongs to transporter and has sufficient capacity
    const vehicle = await Vehicle.findOne({
      _id: new Types.ObjectId(data.vehicleId),
      transporterId: new Types.ObjectId(transporterId)
    });

    if (!vehicle) {
      const err: any = new Error('Vehicle not found or does not belong to you.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    if (vehicle.capacityTons < shipment.weightTons) {
      const err: any = new Error(
        `Vehicle capacity (${vehicle.capacityTons}T) is less than required shipment weight (${shipment.weightTons}T).`
      );
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    // 3. Prevent duplicate active quotations
    const existing = await Quotation.findOne({
      shipmentId: new Types.ObjectId(data.shipmentId),
      transporterId: new Types.ObjectId(transporterId),
      status: QuotationStatus.SUBMITTED
    });

    if (existing) {
      const err: any = new Error('You already have an active pending quotation for this shipment.');
      err.statusCode = 409;
      err.isOperational = true;
      throw err;
    }

    // 4. Create quotation
    const quotation = await Quotation.create({
      shipmentId: new Types.ObjectId(data.shipmentId),
      transporterId: new Types.ObjectId(transporterId),
      vehicleId: new Types.ObjectId(data.vehicleId),
      proposedPriceInr: data.proposedPriceInr,
      estimatedPickupDate: data.estimatedPickupDate,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      comments: data.comments,
      status: QuotationStatus.SUBMITTED
    });

    // 5. Update shipment status to QUOTATION_RECEIVED
    if (shipment.status === ShipmentStatus.PUBLISHED) {
      shipment.status = ShipmentStatus.QUOTATION_RECEIVED;
      await shipment.save();
    }

    // 6. Notify shipper
    await Notification.create({
      userId: shipment.shipperId,
      title: 'New Quotation Received',
      message: `A quotation of ₹${data.proposedPriceInr.toLocaleString('en-IN')} was submitted for your load: ${shipment.title}`,
      type: 'QUOTATION',
      link: `/dashboard/shipper?shipmentId=${shipment._id}`
    });

    await AuditLog.create({
      actorId: new Types.ObjectId(transporterId),
      action: 'QUOTATION_SUBMITTED',
      targetEntity: 'Quotation',
      targetId: quotation._id.toString(),
      metadata: { proposedPriceInr: data.proposedPriceInr }
    });

    return quotation;
  }

  async getQuotationsForShipment(shipmentId: string): Promise<IQuotation[]> {
    return Quotation.find({ shipmentId: new Types.ObjectId(shipmentId) })
      .populate('transporterId', 'fullName companyName phone city verificationStatus')
      .populate('vehicleId', 'registrationNumber vehicleType capacityTons bodyType')
      .sort({ proposedPriceInr: 1 });
  }

  async getMyQuotations(transporterId: string): Promise<IQuotation[]> {
    return Quotation.find({ transporterId: new Types.ObjectId(transporterId) })
      .populate('shipmentId', 'title pickupCity deliveryCity pickupDate weightTons cargoType status')
      .populate('vehicleId', 'registrationNumber vehicleType capacityTons')
      .sort({ createdAt: -1 });
  }

  async withdrawQuotation(quotationId: string, transporterId: string): Promise<IQuotation | null> {
    const quotation = await Quotation.findOne({
      _id: new Types.ObjectId(quotationId),
      transporterId: new Types.ObjectId(transporterId)
    });

    if (!quotation) {
      const err: any = new Error('Quotation not found or unauthorized.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (quotation.status !== QuotationStatus.SUBMITTED) {
      const err: any = new Error(`Cannot withdraw quotation with status: ${quotation.status}`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    quotation.status = QuotationStatus.WITHDRAWN;
    await quotation.save();
    return quotation;
  }

  async rejectQuotation(quotationId: string, shipperId: string): Promise<IQuotation | null> {
    const quotation = await Quotation.findById(quotationId).populate('shipmentId');
    if (!quotation) {
      const err: any = new Error('Quotation not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    const shipment: any = quotation.shipmentId;
    if (shipment.shipperId.toString() !== shipperId) {
      const err: any = new Error('Unauthorized to reject quotation for this shipment.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    quotation.status = QuotationStatus.REJECTED;
    await quotation.save();

    await Notification.create({
      userId: quotation.transporterId,
      title: 'Quotation Declined',
      message: `Your quotation for load '${shipment.title}' was not selected.`,
      type: 'QUOTATION'
    });

    return quotation;
  }
}

export const quotationService = new QuotationService();
