import { Vehicle, IVehicle } from '../../infrastructure/database/models/Vehicle';
import { VehicleType, CargoType, VerificationStatus } from '@loadvanta/contracts';
import { Types } from 'mongoose';

export interface VehicleFilterOptions {
  city?: string;
  vehicleType?: VehicleType;
  minCapacity?: number;
  maxCapacity?: number;
  cargoType?: CargoType;
  isAvailable?: boolean;
  transporterId?: string;
  page?: number;
  limit?: number;
}

export class VehicleService {
  async createVehicle(
    transporterId: string,
    data: {
      registrationNumber: string;
      vehicleType: VehicleType;
      bodyType: string;
      capacityTons: number;
      supportedCargoTypes: CargoType[];
      currentCity: string;
      dimensions?: { lengthFeet?: number; widthFeet?: number; heightFeet?: number };
    }
  ): Promise<IVehicle> {
    const existing = await Vehicle.findOne({
      registrationNumber: data.registrationNumber.toUpperCase().trim()
    });

    if (existing) {
      const err: any = new Error(`Vehicle with registration number ${data.registrationNumber} already exists.`);
      err.statusCode = 409;
      err.code = 'VEHICLE_EXISTS';
      err.isOperational = true;
      throw err;
    }

    const vehicle = await Vehicle.create({
      transporterId: new Types.ObjectId(transporterId),
      registrationNumber: data.registrationNumber.toUpperCase().trim(),
      vehicleType: data.vehicleType,
      bodyType: data.bodyType || 'Container',
      capacityTons: data.capacityTons,
      supportedCargoTypes: data.supportedCargoTypes || [CargoType.GENERAL_MERCHANDISE],
      currentCity: data.currentCity.trim(),
      dimensions: data.dimensions,
      isAvailable: true,
      verificationStatus: VerificationStatus.PENDING
    });

    return vehicle;
  }

  async getVehicles(filters: VehicleFilterOptions) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.city) {
      query.currentCity = { $regex: new RegExp(`^${filters.city.trim()}$`, 'i') };
    }

    if (filters.vehicleType) {
      query.vehicleType = filters.vehicleType;
    }

    if (filters.cargoType) {
      query.supportedCargoTypes = filters.cargoType;
    }

    if (filters.minCapacity !== undefined || filters.maxCapacity !== undefined) {
      query.capacityTons = {};
      if (filters.minCapacity !== undefined) query.capacityTons.$gte = filters.minCapacity;
      if (filters.maxCapacity !== undefined) query.capacityTons.$lte = filters.maxCapacity;
    }

    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }

    if (filters.transporterId) {
      query.transporterId = new Types.ObjectId(filters.transporterId);
    }

    const [items, total] = await Promise.all([
      Vehicle.find(query)
        .populate('transporterId', 'fullName companyName phone city verificationStatus')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(query)
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

  async getVehicleById(id: string): Promise<IVehicle | null> {
    return Vehicle.findById(id).populate('transporterId', 'fullName companyName phone city verificationStatus');
  }

  async updateVehicle(
    vehicleId: string,
    transporterId: string,
    updates: Partial<IVehicle>
  ): Promise<IVehicle | null> {
    const vehicle = await Vehicle.findOne({
      _id: new Types.ObjectId(vehicleId),
      transporterId: new Types.ObjectId(transporterId)
    });

    if (!vehicle) {
      const err: any = new Error('Vehicle not found or unauthorized to update.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      err.isOperational = true;
      throw err;
    }

    Object.assign(vehicle, updates);
    await vehicle.save();
    return vehicle;
  }

  async deactivateVehicle(vehicleId: string, transporterId: string): Promise<IVehicle | null> {
    return this.updateVehicle(vehicleId, transporterId, { isAvailable: false } as any);
  }
}

export const vehicleService = new VehicleService();
