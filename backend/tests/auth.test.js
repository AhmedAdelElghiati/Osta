const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  test('registers a valid customer and returns user without password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Customer',
        email: 'alice@example.com',
        phone: '+1234567890',
        password: 'StrongPass123!',
        role: 'customer',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('alice@example.com');
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('rejects duplicate email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another Customer',
        email: 'alice@example.com',
        phone: '+1234567891',
        password: 'StrongPass123!',
        role: 'customer',
      })
      .expect(409);

    expect(response.body.success).toBe(false);
  });

  test('registers an artisan with a profile', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Artisan',
        email: 'bob@example.com',
        phone: '+1234567892',
        password: 'StrongPass123!',
        role: 'artisan',
        profession: 'Electrician',
        bio: 'Experienced electrician',
        experienceYears: 6,
        skills: ['wiring', 'repair'],
        serviceAreas: ['Downtown'],
        hourlyRate: 80,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('artisan');
    expect(response.body.data.artisan.profession).toBe('Electrician');
  });

  test('rejects admin public registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'System Admin',
        email: 'admin@example.com',
        phone: '+1234567893',
        password: 'StrongPass123!',
        role: 'admin',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('logs in with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'StrongPass123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('alice@example.com');
    expect(response.headers['set-cookie']).toBeTruthy();
  });

  test('rejects invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'WrongPass123!',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('returns current authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'StrongPass123!',
      });

    const cookie = loginResponse.headers['set-cookie'][0].split(';')[0];

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [cookie])
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('alice@example.com');
  });

  test('refreshes the session using the refresh cookie without a request body', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'StrongPass123!',
      });

    const cookies = loginResponse.headers['set-cookie'].map((cookie) => cookie.split(';')[0]);

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.user.email).toBe('alice@example.com');
  });

  test('requires authentication for profile route', async () => {
    const response = await request(app).get('/api/auth/me').expect(401);
    expect(response.body.success).toBe(false);
  });

  test('rejects customer access to admin-only route', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'StrongPass123!',
      });

    const cookie = loginResponse.headers['set-cookie'][0].split(';')[0];

    const response = await request(app)
      .get('/api/admin/test')
      .set('Cookie', [cookie])
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});
