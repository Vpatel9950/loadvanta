import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus, MilestoneType, PaymentStatus } from '@loadvanta/contracts';

export interface IMilestone {
  type: MilestoneType;
  title: string;
  description?: string;
  location?: string;
  timestamp: Date;
  updatedBy: Types.ObjectId;
}

export interface IBooking extends Document {
  bookingNumber: string; // e.g. LV-2026-0001
  shipmentId: Types.ObjectId;
  shipperId: Types.ObjectId;
  transporterId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  quotationId: Types.ObjectId;
  agreedPriceInr: number;
  platformFeeInr: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  milestones: IMilestone[];
  deliveryProof?: {
    documentUrl: string;
    uploadedAt: Date;
    receiverName?: string;
    notes?: string;
  };
  scheduledPickupDate: Date;
  scheduledDeliveryDate: Date;
  actualDeliveryDate?: Date;
  liveTracking?: {
    lastKnownLocation?: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp: Date;
    };
    isActive: boolean;
    startedAt?: Date;
    history?: Array<{
      latitude: number;
      longitude: number;
      timestamp: Date;
      speed?: number;
      heading?: number;
    }>;
  };
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, unique: true, index: true },
    shipperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    agreedPriceInr: { type: Number, required: true, min: 100 },
    platformFeeInr: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.CONFIRMED,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    milestones: [
      {
        type: { type: String, enum: Object.values(MilestoneType), required: true },
        title: { type: String, required: true },
        description: { type: String },
        location: { type: String },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    deliveryProof: {
      documentUrl: { type: String },
      uploadedAt: { type: Date },
      receiverName: { type: String },
      notes: { type: String }
    },
    scheduledPickupDate: { type: Date, required: true },
    scheduledDeliveryDate: { type: Date, required: true },
    actualDeliveryDate: { type: Date },
    liveTracking: {
      lastKnownLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        heading: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        accuracy: { type: Number },
        timestamp: { type: Date }
      },
      isActive: { type: Boolean, default: false },
      startedAt: { type: Date },
      history: [
        {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          timestamp: { type: Date, default: Date.now },
          speed: { type: Number, default: 0 },
          heading: { type: Number, default: 0 }
        }
      ]
    },
    cancellationReason: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

// Indexes for conflict checks and ownership lookups
BookingSchema.index({ vehicleId: 1, status: 1 });
BookingSchema.index({ transporterId: 1, status: 1 });
BookingSchema.index({ shipperId: 1, status: 1 });

export const Booking = model<IBooking>('Booking', BookingSchema);
