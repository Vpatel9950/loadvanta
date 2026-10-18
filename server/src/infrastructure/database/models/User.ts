import { Schema, model, Document } from 'mongoose';
import { UserRole, VerificationStatus } from '@loadvanta/contracts';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  companyName?: string;
  city: string;
  state: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  documents?: {
    type: string;
    url: string;
    uploadedAt: Date;
    verified: boolean;
  }[];
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true, index: true },
    companyName: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'Punjab', trim: true },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true
    },
    verificationNotes: { type: String },
    documents: [
      {
        type: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false }
      }
    ],
    isEmailVerified: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const User = model<IUser>('User', UserSchema);
