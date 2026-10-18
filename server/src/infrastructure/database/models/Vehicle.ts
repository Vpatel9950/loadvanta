import { Schema, model, Document, Types } from 'mongoose';
import { VehicleType, CargoType, VerificationStatus } from '@loadvanta/contracts';

export interface IVehicle extends Document {
  transporterId: Types.ObjectId;
  registrationNumber: string; // e.g. PB10AB1234
  vehicleType: VehicleType;
  bodyType: string; // Open, Container, Tarpaulin, Flatbed
  capacityTons: number;
  dimensions?: {
    lengthFeet?: number;
    widthFeet?: number;
    heightFeet?: number;
  };
  supportedCargoTypes: CargoType[];
  currentCity: string;
  isAvailable: boolean;
  availableFrom?: Date;
  activeBookingId?: Types.ObjectId;
  verificationStatus: VerificationStatus;
  documents?: {
    rcNumber?: string;
    rcDocumentUrl?: string;
    fitnessExpiryDate?: Date;
    insuranceExpiryDate?: Date;
    permitType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    transporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    vehicleType: { type: String, enum: Object.values(VehicleType), required: true, index: true },
    bodyType: { type: String, required: true, default: 'Container' },
    capacityTons: { type: Number, required: true, min: 0.5, max: 60, index: true },
    dimensions: {
      lengthFeet: { type: Number },
      widthFeet: { type: Number },
      heightFeet: { type: Number }
    },
    supportedCargoTypes: [{ type: String, enum: Object.values(CargoType) }],
    currentCity: { type: String, required: true, trim: true, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    availableFrom: { type: Date, default: Date.now },
    activeBookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true
    },
    documents: {
      rcNumber: { type: String },
      rcDocumentUrl: { type: String },
      fitnessExpiryDate: { type: Date },
      insuranceExpiryDate: { type: Date },
      permitType: { type: String }
    }
  },
  {
    timestamps: true
  }
);

VehicleSchema.index({ currentCity: 1, isAvailable: 1, capacityTons: 1 });

export const Vehicle = model<IVehicle>('Vehicle', VehicleSchema);
