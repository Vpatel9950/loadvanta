import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserRole, VehicleType, CargoType, MilestoneType } from '@loadvanta/contracts';

describe('Loadvanta Complete Marketplace Lifecycle E2E', () => {
  let shipperToken: string;
  let transporterToken: string;
  let testVehicleId: string;
  let testShipmentId: string;
  let testQuotationId: string;
  let testBookingId: string;

  beforeAll(async () => {
    await connectDatabase();

    // Login Shipper
    const sLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'shipper@loadvanta.com', password: 'Password@123' });
    shipperToken = sLogin.body.data.accessToken;

    // Login Transporter
    const tLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'transporter@loadvanta.com', password: 'Password@123' });
    transporterToken = tLogin.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  }, 30000);

  it('1. Transporter adds a commercial vehicle to fleet', async () => {
    const regNum = `PB10TEST${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${transporterToken}`)
      .send({
        registrationNumber: regNum,
        vehicleType: VehicleType.HEAVY_DUTY,
        bodyType: 'Container 28ft',
        capacityTons: 16,
        currentCity: 'Jalandhar',
        supportedCargoTypes: [CargoType.TEXTILES_GARMENTS, CargoType.GENERAL_MERCHANDISE]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registrationNumber).toBe(regNum);
    testVehicleId = res.body.data._id;
  });

  it('2. Shipper posts and publishes a new freight consignment', async () => {
    const res = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', `Bearer ${shipperToken}`)
      .send({
        title: 'E2E Fabric Rolls from Jalandhar to Ludhiana',
        pickupCity: 'Jalandhar',
        pickupAddress: 'Leather Complex Phase 2',
        deliveryCity: 'Ludhiana',
        deliveryAddress: 'Focal Point Phase 5',
        cargoType: CargoType.TEXTILES_GARMENTS,
        weightTons: 12,
        requiredVehicleType: VehicleType.HEAVY_DUTY,
        pickupDate: new Date(),
        deliveryDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        targetPriceInr: 14000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
    testShipmentId = res.body.data._id;
  });

  it('3. Return-Load matching engine scores the shipment for the vehicle', async () => {
    const res = await request(app)
      .get(`/api/v1/matches/vehicle/${testVehicleId}?homeCity=Ludhiana`)
      .set('Authorization', `Bearer ${transporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const match = res.body.data.find((m: any) => m.shipment._id === testShipmentId);
    expect(match).toBeDefined();
    expect(match.score).toBeGreaterThanOrEqual(70);
    expect(match.breakdown.explanations.length).toBeGreaterThan(0);
  });

  it('4. Transporter submits quotation for the published load', async () => {
    const res = await request(app)
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${transporterToken}`)
      .send({
        shipmentId: testShipmentId,
        vehicleId: testVehicleId,
        proposedPriceInr: 14500,
        estimatedPickupDate: new Date(),
        estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        comments: 'Ready for loading at Jalandhar'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.proposedPriceInr).toBe(14500);
    testQuotationId = res.body.data._id;
  });

  it('5. Shipper accepts quotation and confirms booking', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${shipperToken}`)
      .send({ quotationId: testQuotationId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.bookingNumber).toContain('LV-');
    testBookingId = res.body.data._id;
  });

  it('6. Double-booking conflict check: vehicle is marked unavailable', async () => {
    const vehRes = await request(app).get(`/api/v1/vehicles/${testVehicleId}`);
    expect(vehRes.body.data.isAvailable).toBe(false);
    expect(vehRes.body.data.activeBookingId).toBe(testBookingId);
  });

  it('7. Transporter updates trip milestone to IN_TRANSIT', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/milestones`)
      .set('Authorization', `Bearer ${transporterToken}`)
      .send({
        type: MilestoneType.TRUCK_DISPATCHED,
        location: 'Jalandhar Bypass NH44',
        description: 'Loaded and in transit to Ludhiana'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_TRANSIT');
  });

  it('8. Shipper creates and completes verified payment for booking', async () => {
    const orderRes = await request(app)
      .post('/api/v1/payments/orders')
      .set('Authorization', `Bearer ${shipperToken}`)
      .send({ bookingId: testBookingId });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.amountPaise).toBe(1450000);

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${shipperToken}`)
      .send({
        bookingId: testBookingId,
        razorpayOrderId: orderRes.body.data.razorpayOrderId,
        razorpayPaymentId: 'pay_test_verified_123',
        razorpaySignature: 'sig_test_verified'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.paymentRecord.status).toBe('CAPTURED');
  });
});
