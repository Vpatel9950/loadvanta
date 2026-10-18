import { z } from 'zod';

// Roles
export enum UserRole {
  SHIPPER = 'SHIPPER',
  TRANSPORTER = 'TRANSPORTER',
  ADMIN = 'ADMIN'
}

// Verification Status
export enum VerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

// Vehicle Category / Types
export enum VehicleType {
  MINI_TRUCK = 'MINI_TRUCK', // e.g. Tata Ace, Bolero Maxi (1-2.5 Ton)
  LIGHT_COMMERCIAL = 'LIGHT_COMMERCIAL', // 14ft - 19ft (3.5-7 Ton)
  MEDIUM_DUTY = 'MEDIUM_DUTY', // 6-wheeler (9-12 Ton)
  HEAVY_DUTY = 'HEAVY_DUTY', // 10-wheeler / 12-wheeler (16-25 Ton)
  MULTI_AXLE_TRAILER = 'MULTI_AXLE_TRAILER', // 18-wheeler / 22-wheeler (30-45 Ton)
  CONTAINER_BODY = 'CONTAINER_BODY', // 20ft / 32ft SXL / MXL
  OPEN_BODY = 'OPEN_BODY'
}

// Cargo Categories
export enum CargoType {
  AGRICULTURAL_GRAINS = 'AGRICULTURAL_GRAINS', // Wheat, Paddy, Basmati (Major Punjab Cargo)
  FMCG_PACKAGED = 'FMCG_PACKAGED',
  TEXTILES_GARMENTS = 'TEXTILES_GARMENTS', // Ludhiana Hosiery & Garments
  INDUSTRIAL_AUTO_PARTS = 'INDUSTRIAL_AUTO_PARTS', // Ludhiana / Jalandhar Engineering
  CONSTRUCTION_STEEL = 'CONSTRUCTION_STEEL', // Mandi Gobindgarh Steel
  CHEMICALS_FERTILIZERS = 'CHEMICALS_FERTILIZERS',
  SPORTS_GOODS = 'SPORTS_GOODS', // Jalandhar Sports Goods
  PERISHABLE_COLD = 'PERISHABLE_COLD',
  GENERAL_MERCHANDISE = 'GENERAL_MERCHANDISE'
}

// Shipment Lifecycle
export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  QUOTATION_RECEIVED = 'QUOTATION_RECEIVED',
  QUOTATION_ACCEPTED = 'QUOTATION_ACCEPTED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Quotation Lifecycle
export enum QuotationStatus {
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

// Booking Lifecycle
export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Trip Milestones
export enum MilestoneType {
  BOOKED = 'BOOKED',
  TRUCK_DISPATCHED = 'TRUCK_DISPATCHED',
  ARRIVED_PICKUP = 'ARRIVED_PICKUP',
  LOADED_IN_TRANSIT = 'LOADED_IN_TRANSIT',
  HALFWAY = 'HALFWAY',
  ARRIVED_DESTINATION = 'ARRIVED_DESTINATION',
  UNLOADED = 'UNLOADED',
  DELIVERED = 'DELIVERED',
  POD_SUBMITTED = 'POD_SUBMITTED',
  COMPLETED = 'COMPLETED'
}

// Zod Schemas for Validation
export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole),
  companyName: z.string().optional(),
  city: z.string().min(2, 'City is required')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
