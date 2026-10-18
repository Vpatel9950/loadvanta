import { Shipment, IShipment } from '../../infrastructure/database/models/Shipment';
import { ShipmentStatus, CargoType, VehicleType } from '@loadvanta/contracts';
import { Types } from 'mongoose';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';

export interface ShipmentFilterOptions {
  pickupCity?: string;
  deliveryCity?: string;
  cargoType?: CargoType;
  requiredVehicleType?: VehicleType;
  status?: ShipmentStatus;
  shipperId?: string;
  page?: number;
  limit?: number;
}

export class ShipmentService {
  async createShipment(
    shipperId: string,
    data: {
      title: string;
      pickupCity: string;
      pickupAddress: string;
      deliveryCity: string;
      deliveryAddress: string;
      cargoType: CargoType;
      cargoDescription?: string;
      weightTons: number;
      requiredVehicleType: VehicleType;
      pickupDate: Date;
      deliveryDeadline: Date;
      targetPriceInr?: number;
      isRfq?: boolean;
      status?: ShipmentStatus;
      notes?: string;
    }
  ): Promise<IShipment> {
    const shipment = await Shipment.create({
      shipperId: new Types.ObjectId(shipperId),
      title: data.title,
      pickupCity: data.pickupCity.trim(),
      pickupAddress: data.pickupAddress,
      deliveryCity: data.deliveryCity.trim(),
      deliveryAddress: data.deliveryAddress,
      cargoType: data.cargoType,
      cargoDescription: data.cargoDescription,
      weightTons: data.weightTons,
      requiredVehicleType: data.requiredVehicleType,
      pickupDate: data.pickupDate,
      deliveryDeadline: data.deliveryDeadline,
      targetPriceInr: data.targetPriceInr,
      isRfq: data.isRfq ?? true,
      status: data.status || ShipmentStatus.PUBLISHED,
      notes: data.notes
    });

    await AuditLog.create({
      actorId: new Types.ObjectId(shipperId),
      action: 'SHIPMENT_CREATED',
      targetEntity: 'Shipment',
      targetId: shipment._id.toString(),
      metadata: { status: shipment.status }
    });

    return shipment;
  }

  async getShipments(filters: ShipmentFilterOptions) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.pickupCity) {
      query.pickupCity = { $regex: new RegExp(`^${filters.pickupCity.trim()}$`, 'i') };
    }

    if (filters.deliveryCity) {
      query.deliveryCity = { $regex: new RegExp(`^${filters.deliveryCity.trim()}$`, 'i') };
    }

    if (filters.cargoType) {
      query.cargoType = filters.cargoType;
    }

    if (filters.requiredVehicleType) {
      query.requiredVehicleType = filters.requiredVehicleType;
    }

    if (filters.shipperId) {
      query.shipperId = new Types.ObjectId(filters.shipperId);
      if (filters.status) {
        query.status = filters.status;
      }
    } else {
      // Public search shows PUBLISHED or QUOTATION_RECEIVED
      query.status = { $in: [ShipmentStatus.PUBLISHED, ShipmentStatus.QUOTATION_RECEIVED] };
    }

    const [items, total] = await Promise.all([
      Shipment.find(query)
        .populate('shipperId', 'fullName companyName city')
        .sort({ pickupDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shipment.countDocuments(query)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getShipmentById(id: string): Promise<IShipment | null> {
    return Shipment.findById(id).populate('shipperId', 'fullName companyName phone city');
  }

  async updateShipment(
    id: string,
    shipperId: string,
    updates: Partial<IShipment>
  ): Promise<IShipment | null> {
    const shipment = await Shipment.findOne({
      _id: new Types.ObjectId(id),
      shipperId: new Types.ObjectId(shipperId)
    });

    if (!shipment) {
      const err: any = new Error('Shipment not found or unauthorized.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (
      shipment.status === ShipmentStatus.BOOKING_CONFIRMED ||
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      const err: any = new Error('Cannot modify a shipment with confirmed or active booking.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    Object.assign(shipment, updates);
    await shipment.save();
    return shipment;
  }

  async publishShipment(id: string, shipperId: string): Promise<IShipment | null> {
    return this.updateShipment(id, shipperId, { status: ShipmentStatus.PUBLISHED } as any);
  }

  async cancelShipment(id: string, shipperId: string): Promise<IShipment | null> {
    const shipment = await Shipment.findOne({
      _id: new Types.ObjectId(id),
      shipperId: new Types.ObjectId(shipperId)
    });

    if (!shipment) {
      const err: any = new Error('Shipment not found or unauthorized.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (shipment.status === ShipmentStatus.IN_TRANSIT || shipment.status === ShipmentStatus.DELIVERED) {
      const err: any = new Error('Cannot cancel a shipment already in transit or delivered.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    shipment.status = ShipmentStatus.CANCELLED;
    await shipment.save();
    return shipment;
  }
}

export const shipmentService = new ShipmentService();
