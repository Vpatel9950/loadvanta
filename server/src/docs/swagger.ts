export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Loadvanta Logistics Marketplace API',
    version: '1.0.0',
    description: 'REST API documentation for Loadvanta - Freight Marketplace and Return-Load Matching Engine for Punjab and North India.',
    contact: {
      name: 'Loadvanta Engineering',
      email: 'tech@loadvanta.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new Shipper or Transporter account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Gurpreet Singh' },
                  email: { type: 'string', example: 'gurpreet@example.com' },
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'SecurePassword123' },
                  role: { type: 'string', enum: ['SHIPPER', 'TRANSPORTER'], example: 'TRANSPORTER' },
                  companyName: { type: 'string', example: 'Punjab Road Carriers' },
                  city: { type: 'string', example: 'Ludhiana' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Login successful with JWT access token' }
        }
      }
    },
    '/shipments': {
      get: {
        summary: 'Search active published shipments with filters',
        tags: ['Shipments'],
        parameters: [
          { name: 'pickupCity', in: 'query', schema: { type: 'string' } },
          { name: 'deliveryCity', in: 'query', schema: { type: 'string' } },
          { name: 'cargoType', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'List of published loads' }
        }
      },
      post: {
        summary: 'Create a new shipment (Shipper)',
        tags: ['Shipments'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Shipment created' }
        }
      }
    },
    '/vehicles': {
      get: {
        summary: 'Search available trucks with filters',
        tags: ['Vehicles'],
        responses: {
          200: { description: 'List of available vehicles' }
        }
      }
    },
    '/matches/vehicle/{vehicleId}': {
      get: {
        summary: 'Calculate return loads matching for a vehicle',
        tags: ['Return-Load Matching'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Ranked list of return loads with explainable score breakdown' }
        }
      }
    },
    '/payments/orders': {
      post: {
        summary: 'Create a Razorpay payment order for a confirmed booking',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Razorpay order created with payment record' }
        }
      }
    },
    '/payments/verify': {
      post: {
        summary: 'Verify Razorpay payment signature cryptographically',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Payment verified and booking updated' }
        }
      }
    }
  }
};
