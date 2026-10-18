import { Schema, model, Document, Types } from 'mongoose';
import { PaymentStatus } from '@loadvanta/contracts';

export interface IPaymentRecord extends Document {
  bookingId: Types.ObjectId;
  payerId: Types.ObjectId;
  amountPaise: number; // Stored in minor units (1 INR = 100 Paise)
  currency: string; // 'INR'
  status: PaymentStatus;
  provider: string; // 'RAZORPAY'
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  idempotencyKey?: string;
  failureReason?: string;
  rawWebhookPayload?: any;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    payerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountPaise: { type: Number, required: true, min: 100 },
    currency: { type: String, required: true, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true
    },
    provider: { type: String, default: 'RAZORPAY' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    failureReason: { type: String },
    rawWebhookPayload: { type: Schema.Types.Mixed },
    verifiedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const PaymentRecord = model<IPaymentRecord>('PaymentRecord', PaymentRecordSchema);
