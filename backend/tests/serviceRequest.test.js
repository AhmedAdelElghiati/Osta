const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');
const Craft = require('../src/models/Craft');

jest.setTimeout(30000);

let mongoServer;
let customerCookie;
let otherCustomerCookie;
let craft;
let requestId;

const requestBody = () => ({
  title: 'إصلاح تسريب مياه',
  description: 'محتاج سباك يصلح تسريب في الحمام ويغير المحبس.',
  craftId: craft._id.toString(),
  location: { city: 'القاهرة', area: 'المعادي', address: 'شارع اللاسلكي' },
  preferredDate: '2099-10-05',
  preferredTime: '14:00',
  budget: { min: 500, max: 1000 },
  receiveMode: 'OFFERS',
});

const login = async (email) => {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' });
  return response.headers['set-cookie'][0].split(';')[0];
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDatabase();
  await request(app).post('/api/auth/register').send({ name: 'عميل أول', email: 'requester@example.com', phone: '01000000001', password: 'StrongPass123!', role: 'customer' });
  await request(app).post('/api/auth/register').send({ name: 'عميل تاني', email: 'other@example.com', phone: '01000000002', password: 'StrongPass123!', role: 'customer' });
  craft = await Craft.create({ name: 'سباكة', slug: 'test-plumbing', isActive: true });
  customerCookie = await login('requester@example.com');
  otherCustomerCookie = await login('other@example.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Service Requests API', () => {
  test('creates an owned draft and ignores no owner substitution', async () => {
    const response = await request(app)
      .post('/api/v1/requests')
      .set('Cookie', [customerCookie])
      .send({ ...requestBody(), customerId: new mongoose.Types.ObjectId().toString() })
      .expect(400);
    expect(response.body.success).toBe(false);

    const created = await request(app).post('/api/v1/requests').set('Cookie', [customerCookie]).send(requestBody()).expect(201);
    requestId = created.body.data._id;
    expect(created.body.data.status).toBe('DRAFT');
  });

  test('enforces ownership and lifecycle transitions', async () => {
    await request(app).get(`/api/v1/requests/${requestId}`).set('Cookie', [otherCustomerCookie]).expect(404);
    await request(app).post(`/api/v1/requests/${requestId}/publish`).set('Cookie', [customerCookie]).expect(200);
    await request(app).post(`/api/v1/requests/${requestId}/publish`).set('Cookie', [customerCookie]).expect(409);
    await request(app).post(`/api/v1/requests/${requestId}/cancel`).set('Cookie', [customerCookie]).send({ reason: 'لقيت حل تاني' }).expect(200);
    const republished = await request(app).post(`/api/v1/requests/${requestId}/republish`).set('Cookie', [customerCookie]).expect(200);
    expect(republished.body.data.status).toBe('PUBLISHED');
  });

  test('lists through MongoDB-backed filters and returns timeline', async () => {
    const listed = await request(app).get('/api/v1/requests/me?search=تسريب&page=1&limit=10').set('Cookie', [customerCookie]).expect(200);
    expect(listed.body.data.items).toHaveLength(1);
    expect(listed.body.data.pagination.total).toBe(1);

    const timeline = await request(app).get(`/api/v1/requests/${requestId}/timeline`).set('Cookie', [customerCookie]).expect(200);
    expect(timeline.body.data.map((event) => event.type)).toEqual([
      'REQUEST_CREATED', 'REQUEST_PUBLISHED', 'REQUEST_CANCELLED', 'REQUEST_REPUBLISHED',
    ]);
  });

  test('uploads and deletes allowed images while rejecting unsupported MIME types', async () => {
    const uploaded = await request(app)
      .post(`/api/v1/requests/${requestId}/images`)
      .set('Cookie', [customerCookie])
      .attach('images', Buffer.from('png bytes'), { filename: 'leak.png', contentType: 'image/png' })
      .expect(201);
    const imageId = uploaded.body.data.images[0]._id;
    expect(uploaded.body.data.images[0].mimeType).toBe('image/png');

    await request(app)
      .delete(`/api/v1/requests/${requestId}/images/${imageId}`)
      .set('Cookie', [customerCookie])
      .expect(200);

    await request(app)
      .post(`/api/v1/requests/${requestId}/images`)
      .set('Cookie', [customerCookie])
      .attach('images', Buffer.from('text'), { filename: 'notes.txt', contentType: 'text/plain' })
      .expect(400);
  });
});
