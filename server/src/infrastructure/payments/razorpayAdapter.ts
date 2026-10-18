import crypto from 'crypto';
import { config } from '../../config/env';

export interface RazorpayOrderOptions {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export class RazorpayAdapter {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  public isConfigured: boolean;

  constructor() {
    this.keyId = config.razorpay.keyId;
    this.keySecret = config.razorpay.keySecret;
    this.webhookSecret = config.razorpay.webhookSecret;
    this.isConfigured = config.razorpay.isConfigured;
  }

  public getStatus() {
    return {
      isConfigured: this.isConfigured,
      keyIdAvailable: !!this.keyId,
      mode: this.isConfigured ? (this.keyId.startsWith('rzp_test') ? 'test' : 'live') : 'unconfigured'
    };
  }

  /**
   * Creates an order with Razorpay API
   */
  public async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
    if (!this.isConfigured) {
      throw new Error(
        'Razorpay credentials are not configured. Please supply valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.'
      );
    }

    const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`
      },
      body: JSON.stringify({
        amount: options.amountPaise,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay Order Creation Failed: ${response.status} - ${errText}`);
    }

    const data = (await response.json()) as RazorpayOrderResponse;
    return data;
  }

  /**
   * Verifies the checkout payment signature:
   * HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
   */
  public verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!this.isConfigured || !this.keySecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  }

  /**
   * Verifies incoming webhook signature against raw body
   */
  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  }
}

export const razorpayAdapter = new RazorpayAdapter();
