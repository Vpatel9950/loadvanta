import { Schema, model, Document, Types } from 'mongoose';
import { QuotationStatus } from '@loadvanta/contracts';

export interface IQuotation extends Document {
  shipmentId: Types.ObjectId;
  transporterId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  proposedPriceInr: number;
  estimatedPickupDate: Date;
  estimatedDeliveryDate: Date;
  comments?: string;
  status: QuotationStatus;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
    transporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    proposedPriceInr: { type: Number, required: true, min: 100 },
    estimatedPickupDate: { type: Date, required: true },
    estimatedDeliveryDate: { type: Date, required: true },
    comments: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.SUBMITTED,
      index: true
    },
    validUntil: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) } // 48 hours default
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active quotations from the same transporter on the same shipment
QuotationSchema.index({ shipmentId: 1, transporterId: 1, status: 1 });

export const Quotation = model<IQuotation>('Quotation', QuotationSchema);
