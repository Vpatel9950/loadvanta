import { Schema, model, Document } from 'mongoose';

export interface IContactEnquiry extends Document {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  subject: string;
  message: string;
  status: 'NEW' | 'RESPONDED' | 'ARCHIVED';
  createdAt: Date;
}

const ContactEnquirySchema = new Schema<IContactEnquiry>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    companyName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['NEW', 'RESPONDED', 'ARCHIVED'], default: 'NEW' }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const ContactEnquiry = model<IContactEnquiry>('ContactEnquiry', ContactEnquirySchema);
