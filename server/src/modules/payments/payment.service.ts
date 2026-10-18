import { PaymentRecord, IPaymentRecord } from '../../infrastructure/database/models/PaymentRecord';
import { Booking } from '../../infrastructure/database/models/Booking';
import { razorpayAdapter } from '../../infrastructure/payments/razorpayAdapter';
import { PaymentStatus, BookingStatus } from '@loadvanta/contracts';
import { Types } from 'mongoose';
import { Notification } from '../../infrastructure/database/models/Notification';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';

export class PaymentService {
  async getPaymentStatus() {
    return razorpayAdapter.getStatus();
  }

  async createPaymentOrder(
    bookingId: string,
    shipperId: string
  ): Promise<{
    paymentRecord: IPaymentRecord;
    razorpayOrderId?: string;
    amountPaise: number;
    currency: string;
    isConfigured: boolean;
    razorpayKeyId?: string;
  }> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (booking.shipperId.toString() !== shipperId) {
      const err: any = new Error('Unauthorized to pay for this booking.');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    if (booking.paymentStatus === PaymentStatus.CAPTURED) {
      const err: any = new Error('This booking is already paid in full.');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }

    const amountPaise = booking.agreedPriceInr * 100;
    const currency = 'INR';

    let razorpayOrderId: string | undefined;

    if (razorpayAdapter.isConfigured) {
      const order = await razorpayAdapter.createOrder({
        amountPaise,
        currency,
        receipt: `rcpt_${booking.bookingNumber}`,
        notes: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber
        }
      });
      razorpayOrderId = order.id;
    } else {
      // Development simulated order ID when live gateway credentials are not yet supplied
      razorpayOrderId = `order_simulated_${Date.now()}`;
    }

    // Upsert PaymentRecord
    let paymentRecord = await PaymentRecord.findOne({ bookingId: booking._id });
    if (!paymentRecord) {
      paymentRecord = await PaymentRecord.create({
        bookingId: booking._id,
        payerId: new Types.ObjectId(shipperId),
        amountPaise,
        currency,
        status: PaymentStatus.PENDING,
        provider: 'RAZORPAY',
        razorpayOrderId
      });
    } else {
      paymentRecord.amountPaise = amountPaise;
      paymentRecord.razorpayOrderId = razorpayOrderId;
      paymentRecord.status = PaymentStatus.PENDING;
      await paymentRecord.save();
    }

    return {
      paymentRecord,
      razorpayOrderId,
      amountPaise,
      currency,
      isConfigured: razorpayAdapter.isConfigured,
      razorpayKeyId: razorpayAdapter.isConfigured ? process.env.RAZORPAY_KEY_ID : undefined
    };
  }

  async verifyPayment(
    bookingId: string,
    shipperId: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }
  ): Promise<{ success: boolean; paymentRecord: IPaymentRecord }> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    const paymentRecord = await PaymentRecord.findOne({ bookingId: booking._id });
    if (!paymentRecord) {
      const err: any = new Error('Payment record not found for this booking.');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    // Verify cryptographic signature if configured
    if (razorpayAdapter.isConfigured) {
      const isValid = razorpayAdapter.verifyPaymentSignature(
        data.razorpayOrderId,
        data.razorpayPaymentId,
        data.razorpaySignature
      );

      if (!isValid) {
        paymentRecord.status = PaymentStatus.FAILED;
        paymentRecord.failureReason = 'Invalid cryptographic signature verification';
        await paymentRecord.save();

        const err: any = new Error('Payment verification failed: invalid signature.');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
    } else {
      // In development unconfigured mode, require explicit simulated token verification
      if (!data.razorpaySignature || data.razorpaySignature === '') {
        const err: any = new Error('Payment signature required.');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }
    }

    // Mark captured
    paymentRecord.status = PaymentStatus.CAPTURED;
    paymentRecord.razorpayPaymentId = data.razorpayPaymentId;
    paymentRecord.razorpaySignature = data.razorpaySignature;
    paymentRecord.verifiedAt = new Date();
    await paymentRecord.save();

    booking.paymentStatus = PaymentStatus.CAPTURED;
    await booking.save();

    // Notify transporter
    await Notification.create({
      userId: booking.transporterId,
      title: 'Payment Received for Booking',
      message: `Shipper completed verified payment of ₹${booking.agreedPriceInr.toLocaleString('en-IN')} for booking ${booking.bookingNumber}.`,
      type: 'PAYMENT'
    });

    // Audit Log
    await AuditLog.create({
      actorId: new Types.ObjectId(shipperId),
      action: 'PAYMENT_VERIFIED',
      targetEntity: 'PaymentRecord',
      targetId: paymentRecord._id.toString(),
      metadata: { amountPaise: paymentRecord.amountPaise, paymentId: data.razorpayPaymentId }
    });

    return { success: true, paymentRecord };
  }

  async handleWebhook(rawBody: string, signature: string, eventPayload: any): Promise<{ handled: boolean }> {
    if (razorpayAdapter.isConfigured) {
      const isValid = razorpayAdapter.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        const err: any = new Error('Invalid webhook signature.');
        err.statusCode = 400;
        throw err;
      }
    }

    const event = eventPayload.event;
    const paymentEntity = eventPayload?.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const record = await PaymentRecord.findOne({ razorpayOrderId: orderId });
      if (record && record.status !== PaymentStatus.CAPTURED) {
        record.status = PaymentStatus.CAPTURED;
        record.razorpayPaymentId = paymentId;
        record.rawWebhookPayload = eventPayload;
        record.verifiedAt = new Date();
        await record.save();

        await Booking.findByIdAndUpdate(record.bookingId, { paymentStatus: PaymentStatus.CAPTURED });
      }
    }

    return { handled: true };
  }
}

export const paymentService = new PaymentService();
