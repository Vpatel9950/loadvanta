import { Schema, model, Document, Types } from 'mongoose';
import { ShipmentStatus, CargoType, VehicleType } from '@loadvanta/contracts';

export interface IShipment extends Document {
  shipperId: Types.ObjectId;
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
  isRfq: boolean; // Request for Quotation
  status: ShipmentStatus;
  selectedQuotationId?: Types.ObjectId;
  activeBookingId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    shipperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    pickupCity: { type: String, required: true, trim: true, index: true },
    pickupAddress: { type: String, required: true },
    deliveryCity: { type: String, required: true, trim: true, index: true },
    deliveryAddress: { type: String, required: true },
    cargoType: { type: String, enum: Object.values(CargoType), required: true, index: true },
    cargoDescription: { type: String },
    weightTons: { type: Number, required: true, min: 0.1, index: true },
    requiredVehicleType: { type: String, enum: Object.values(VehicleType), required: true, index: true },
    pickupDate: { type: Date, required: true, index: true },
    deliveryDeadline: { type: Date, required: true },
    targetPriceInr: { type: Number, min: 0 },
    isRfq: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.DRAFT,
      index: true
    },
    selectedQuotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    activeBookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

ShipmentSchema.index({ pickupCity: 1, deliveryCity: 1, status: 1 });
ShipmentSchema.index({ status: 1, pickupDate: 1 });

export const Shipment = model<IShipment>('Shipment', ShipmentSchema);
