import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../../config/database';
import { User } from './models/User';
import { Vehicle } from './models/Vehicle';
import { Shipment } from './models/Shipment';
import { Quotation } from './models/Quotation';
import { Booking } from './models/Booking';
import { PaymentRecord } from './models/PaymentRecord';
import { Notification } from './models/Notification';
import { ContactEnquiry } from './models/ContactEnquiry';
import { AuditLog } from './models/AuditLog';
import {
  UserRole,
  VerificationStatus,
  VehicleType,
  CargoType,
  ShipmentStatus,
  QuotationStatus,
  BookingStatus,
  MilestoneType,
  PaymentStatus
} from '@loadvanta/contracts';

async function seed() {
  console.log('[Seed] Starting database seeding for Loadvanta Punjab...');
  await connectDatabase();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Shipment.deleteMany({}),
    Quotation.deleteMany({}),
    Booking.deleteMany({}),
    PaymentRecord.deleteMany({}),
    Notification.deleteMany({}),
    ContactEnquiry.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Cleared existing data.');

  // Common password hash for development test users
  const defaultPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Create Users
  const adminUser = await User.create({
    fullName: 'Loadvanta System Admin',
    email: 'admin@loadvanta.com',
    phone: '9800000000',
    passwordHash,
    role: UserRole.ADMIN,
    companyName: 'Loadvanta Technologies Punjab',
    city: 'Mohali',
    state: 'Punjab',
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true
  });

  const shipperUser1 = await User.create({
    fullName: 'Rajesh Mehra',
    email: 'shipper@loadvanta.com',
    phone: '9814012345',
    passwordHash,
    role: UserRole.SHIPPER,
    companyName: 'Vardhman Textiles & Yarn Ltd',
    city: 'Ludhiana',
    state: 'Punjab',
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true
  });

  const shipperUser2 = await User.create({
    fullName: 'Harjit Singh Grewal',
    email: 'harjit@punjabgrains.com',
    phone: '9872054321',
    passwordHash,
    role: UserRole.SHIPPER,
    companyName: 'Grewal Grain Traders (Khanna Mandi)',
    city: 'Khanna',
    state: 'Punjab',
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true
  });

  const transporterUser1 = await User.create({
    fullName: 'Gurpreet Singh Dhillon',
    email: 'transporter@loadvanta.com',
    phone: '9815098765',
    passwordHash,
    role: UserRole.TRANSPORTER,
    companyName: 'Dhillon Malwa Roadways',
    city: 'Ludhiana',
    state: 'Punjab',
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true
  });

  const transporterUser2 = await User.create({
    fullName: 'Jaspal Singh Sandhu',
    email: 'jaspal@majhafreight.com',
    phone: '9888011223',
    passwordHash,
    role: UserRole.TRANSPORTER,
    companyName: 'Majha Express Movers',
    city: 'Amritsar',
    state: 'Punjab',
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true
  });

  const transporterUser3 = await User.create({
    fullName: 'Baldev Raj Verma',
    email: 'baldev@doaba.com',
    phone: '9855033445',
    passwordHash,
    role: UserRole.TRANSPORTER,
    companyName: 'Doaba Logistics Fleet',
    city: 'Jalandhar',
    state: 'Punjab',
    verificationStatus: VerificationStatus.UNDER_REVIEW,
    isEmailVerified: true
  });

  console.log('[Seed] Created users (Admin, Shippers, Transporters).');

  // 2. Create Vehicles
  const vehicle1 = await Vehicle.create({
    transporterId: transporterUser1._id,
    registrationNumber: 'PB10CZ4521',
    vehicleType: VehicleType.HEAVY_DUTY,
    bodyType: 'Container 28ft',
    capacityTons: 16,
    dimensions: { lengthFeet: 28, widthFeet: 8, heightFeet: 8.5 },
    supportedCargoTypes: [CargoType.TEXTILES_GARMENTS, CargoType.FMCG_PACKAGED, CargoType.GENERAL_MERCHANDISE],
    currentCity: 'Ludhiana',
    isAvailable: true,
    verificationStatus: VerificationStatus.VERIFIED
  });

  const vehicle2 = await Vehicle.create({
    transporterId: transporterUser1._id,
    registrationNumber: 'PB10DA8899',
    vehicleType: VehicleType.LIGHT_COMMERCIAL,
    bodyType: 'Covered Eicher 17ft',
    capacityTons: 5.5,
    dimensions: { lengthFeet: 17, widthFeet: 7, heightFeet: 7 },
    supportedCargoTypes: [CargoType.INDUSTRIAL_AUTO_PARTS, CargoType.SPORTS_GOODS, CargoType.GENERAL_MERCHANDISE],
    currentCity: 'Jalandhar',
    isAvailable: true,
    verificationStatus: VerificationStatus.VERIFIED
  });

  const vehicle3 = await Vehicle.create({
    transporterId: transporterUser2._id,
    registrationNumber: 'PB02BK9012',
    vehicleType: VehicleType.HEAVY_DUTY,
    bodyType: '10-Wheeler Open Tarpaulin',
    capacityTons: 22,
    dimensions: { lengthFeet: 32, widthFeet: 8, heightFeet: 8 },
    supportedCargoTypes: [CargoType.AGRICULTURAL_GRAINS, CargoType.CONSTRUCTION_STEEL, CargoType.CHEMICALS_FERTILIZERS],
    currentCity: 'Amritsar',
    isAvailable: true,
    verificationStatus: VerificationStatus.VERIFIED
  });

  const vehicle4 = await Vehicle.create({
    transporterId: transporterUser3._id,
    registrationNumber: 'PB08EF3344',
    vehicleType: VehicleType.MEDIUM_DUTY,
    bodyType: 'Closed Container 20ft',
    capacityTons: 9,
    dimensions: { lengthFeet: 20, widthFeet: 8, heightFeet: 8 },
    supportedCargoTypes: [CargoType.SPORTS_GOODS, CargoType.FMCG_PACKAGED],
    currentCity: 'Jalandhar',
    isAvailable: true,
    verificationStatus: VerificationStatus.PENDING
  });

  console.log('[Seed] Created vehicles.');

  // 3. Create Shipments
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const threeDaysLater = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // Shipment 1: Published open load
  const shipment1 = await Shipment.create({
    shipperId: shipperUser1._id,
    title: 'Textile Fabric Roll Consignment to Jalandhar',
    pickupCity: 'Ludhiana',
    pickupAddress: 'Focal Point Phase IV, Industrial Area, Ludhiana',
    deliveryCity: 'Jalandhar',
    deliveryAddress: 'Leather Complex Road, Industrial Estate, Jalandhar',
    cargoType: CargoType.TEXTILES_GARMENTS,
    cargoDescription: '500 Rolls of Combed Cotton Fabric, carefully palletized',
    weightTons: 12,
    requiredVehicleType: VehicleType.HEAVY_DUTY,
    pickupDate: tomorrow,
    deliveryDeadline: dayAfterTomorrow,
    targetPriceInr: 16500,
    isRfq: true,
    status: ShipmentStatus.PUBLISHED,
    notes: 'Requires weatherproof closed container truck.'
  });

  // Shipment 2: Published open load for Grains (Khanna to Delhi)
  const shipment2 = await Shipment.create({
    shipperId: shipperUser2._id,
    title: 'Basmati Rice Sacks for Delhi Warehouse',
    pickupCity: 'Khanna',
    pickupAddress: 'Asia Grain Hub Mandi Gate 2, Khanna',
    deliveryCity: 'Delhi',
    deliveryAddress: 'Narela Anaj Mandi Cargo Terminal, Delhi',
    cargoType: CargoType.AGRICULTURAL_GRAINS,
    cargoDescription: '400 Bags of Export Quality Premium 1121 Basmati Rice',
    weightTons: 20,
    requiredVehicleType: VehicleType.HEAVY_DUTY,
    pickupDate: tomorrow,
    deliveryDeadline: threeDaysLater,
    targetPriceInr: 42000,
    isRfq: true,
    status: ShipmentStatus.PUBLISHED,
    notes: 'Standard tarpaulin tie-down needed.'
  });

  // Shipment 3: Confirmed Booking with Milestones and Payment
  const shipment3 = await Shipment.create({
    shipperId: shipperUser1._id,
    title: 'Industrial Fasteners & Bolts Delivery',
    pickupCity: 'Ludhiana',
    pickupAddress: 'Dhandari Kalan, GT Road, Ludhiana',
    deliveryCity: 'Amritsar',
    deliveryAddress: 'Focal Point Export Zone, Amritsar',
    cargoType: CargoType.INDUSTRIAL_AUTO_PARTS,
    cargoDescription: 'Zinc Plated High Tensile Fasteners in Wooden Crates',
    weightTons: 14,
    requiredVehicleType: VehicleType.HEAVY_DUTY,
    pickupDate: now,
    deliveryDeadline: tomorrow,
    targetPriceInr: 21000,
    isRfq: false,
    status: ShipmentStatus.IN_TRANSIT
  });

  // 4. Create Quotation for Shipment 3
  const quotation3 = await Quotation.create({
    shipmentId: shipment3._id,
    transporterId: transporterUser1._id,
    vehicleId: vehicle1._id,
    proposedPriceInr: 21000,
    estimatedPickupDate: now,
    estimatedDeliveryDate: tomorrow,
    comments: 'Verified container truck ready for immediate dispatch from GT Road bypass.',
    status: QuotationStatus.ACCEPTED
  });

  // 5. Create Booking for Shipment 3
  const booking3 = await Booking.create({
    bookingNumber: 'LV-2026-0001',
    shipmentId: shipment3._id,
    shipperId: shipperUser1._id,
    transporterId: transporterUser1._id,
    vehicleId: vehicle1._id,
    quotationId: quotation3._id,
    agreedPriceInr: 21000,
    platformFeeInr: 420,
    status: BookingStatus.IN_TRANSIT,
    paymentStatus: PaymentStatus.CAPTURED,
    scheduledPickupDate: now,
    scheduledDeliveryDate: tomorrow,
    milestones: [
      {
        type: MilestoneType.BOOKED,
        title: 'Booking Confirmed',
        description: 'Confirmed at agreed freight ₹21,000',
        location: 'Ludhiana',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedBy: shipperUser1._id
      },
      {
        type: MilestoneType.ARRIVED_PICKUP,
        title: 'Truck Arrived at Dhandari Kalan Warehouse',
        description: 'Truck PB10CZ4521 reported at loading dock',
        location: 'Ludhiana GT Road',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedBy: transporterUser1._id
      },
      {
        type: MilestoneType.LOADED_IN_TRANSIT,
        title: 'Cargo Loaded & Dispatched towards Amritsar',
        description: 'E-Way Bill 5410984128 verified, seal intact',
        location: 'Ludhiana Toll Plaza',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updatedBy: transporterUser1._id
      }
    ]
  });

  // Link shipment 3 to booking and lock vehicle
  shipment3.selectedQuotationId = quotation3._id as any;
  shipment3.activeBookingId = booking3._id as any;
  await shipment3.save();

  vehicle1.isAvailable = false;
  vehicle1.activeBookingId = booking3._id as any;
  await vehicle1.save();

  // Create payment record for booking 3
  await PaymentRecord.create({
    bookingId: booking3._id,
    payerId: shipperUser1._id,
    amountPaise: 2100000,
    currency: 'INR',
    status: PaymentStatus.CAPTURED,
    provider: 'RAZORPAY',
    razorpayOrderId: 'order_seed_lv0001',
    razorpayPaymentId: 'pay_seed_verified_lv0001',
    razorpaySignature: 'sig_seed_verified',
    verifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  });

  // 6. Create Notifications
  await Notification.create({
    userId: transporterUser1._id,
    title: 'Return Load Matched: Jalandhar to Ludhiana',
    message: 'High match score (92%)! Textile rolls load available on your return route back to Ludhiana.',
    type: 'MATCH_RECOMMENDATION',
    link: `/dashboard/transporter?vehicleId=${vehicle1._id}`
  });

  await Notification.create({
    userId: shipperUser1._id,
    title: 'Trip Milestone: Cargo Dispatched',
    message: 'Truck PB10CZ4521 has crossed Ludhiana Toll and is on route to Amritsar.',
    type: 'TRIP_UPDATE',
    link: `/dashboard/shipper?bookingId=${booking3._id}`
  });

  // 7. Create Sample Contact Enquiry
  await ContactEnquiry.create({
    fullName: 'Mohan Lal Sharma',
    email: 'mohan@sharma-trans.com',
    phone: '9814455667',
    companyName: 'Sharma Trans Lines Bathinda',
    subject: 'Fleet partnership inquiry for 15 multi-axle trucks',
    message: 'We operate 15 heavy trucks between Bathinda refinery and Ludhiana. Want to know how to integrate our fleet for return loads.',
    status: 'NEW'
  });

  console.log('[Seed] Database seeding completed successfully!');
  console.log('====================================================');
  console.log('TEST CREDENTIALS:');
  console.log('Admin:       admin@loadvanta.com       / Password@123');
  console.log('Shipper:     shipper@loadvanta.com     / Password@123');
  console.log('Transporter: transporter@loadvanta.com / Password@123');
  console.log('====================================================');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
