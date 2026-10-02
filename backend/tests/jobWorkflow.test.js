const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');
const Craft = require('../src/models/Craft');
const Job = require('../src/models/Job');
const Transaction = require('../src/models/Transaction');

jest.setTimeout(30000);

let mongoServer;
let customerCookie;
let artisanCookie;
let craft;

const login = async (email) => {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' });
  return response.headers['set-cookie'][0].split(';')[0];
};

const makeRequestBody = () => ({
  title: 'إصلاح تسريب في الحمام',
  description: 'محتاج سباك يصلح تسريب واضح تحت الحوض ويغير المحبس.',
  craftId: craft._id.toString(),
  location: { city: 'القاهرة', area: 'مدينة نصر', address: 'شارع عباس العقاد' },
  preferredDate: '2099-10-05',
  preferredTime: '14:00',
  budget: { min: 500, max: 1200 },
  receiveMode: 'OFFERS',
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectDatabase();

  await request(app).post('/api/auth/register').send({
    name: 'عميل تجربة',
    email: 'job-customer@example.com',
    phone: '01000000111',
    password: 'StrongPass123!',
    role: 'customer',
  });
  await request(app).post('/api/auth/register').send({
    name: 'أسطى تجربة',
    email: 'job-artisan@example.com',
    phone: '01000000222',
    password: 'StrongPass123!',
    role: 'artisan',
    profession: 'سباك',
    bio: 'خبرة في السباكة المنزلية',
    experienceYears: 5,
    skills: ['سباكة'],
    serviceAreas: ['مدينة نصر'],
    hourlyRate: 150,
  });

  craft = await Craft.create({ name: 'سباكة', slug: 'plumbing-test', isActive: true });
  customerCookie = await login('job-customer@example.com');
  artisanCookie = await login('job-artisan@example.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Offer acceptance to job workflow', () => {
  test('creates a real job and enforces backend-owned status transitions', async () => {
    const created = await request(app)
      .post('/api/v1/requests')
      .set('Cookie', [customerCookie])
      .send(makeRequestBody())
      .expect(201);

    const requestId = created.body.data._id;
    await request(app).post(`/api/v1/requests/${requestId}/publish`).set('Cookie', [customerCookie]).expect(200);

    const offered = await request(app)
      .post('/api/v1/offers')
      .set('Cookie', [artisanCookie])
      .send({ requestId, price: 900, duration: 'يوم واحد', notes: 'أقدر أخلصها بكرة' })
      .expect(201);

    const offerId = offered.body.data._id;
    const customerOffers = await request(app)
      .get('/api/v1/offers/mine')
      .set('Cookie', [customerCookie])
      .expect(200);
    expect(customerOffers.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: offerId, requestId: expect.objectContaining({ title: 'إصلاح تسريب في الحمام' }) }),
      ]),
    );

    const accepted = await request(app)
      .post(`/api/v1/offers/${offerId}/accept`)
      .set('Cookie', [customerCookie])
      .expect(200);

    expect(accepted.body.data.offer.status).toBe('ACCEPTED');
    expect(accepted.body.data.job.requestId).toBe(requestId);
    expect(accepted.body.data.job.price).toBe(900);
    await expect(Transaction.find({ userId: accepted.body.data.job.customerId }).lean()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'escrow_hold', amount: 900, meta: expect.objectContaining({ direction: 'debit' }) }),
      ]),
    );
    const customerWalletAfterAccept = await request(app).get('/api/v1/wallet').set('Cookie', [customerCookie]).expect(200);
    expect(customerWalletAfterAccept.body.data.escrowBalance).toBe(900);

    await request(app)
      .post(`/api/v1/offers/${offerId}/accept`)
      .set('Cookie', [customerCookie])
      .expect(409);

    const artisanJobs = await request(app).get('/api/v1/jobs/me').set('Cookie', [artisanCookie]).expect(200);
    expect(artisanJobs.body.data.items).toHaveLength(1);
    const jobId = artisanJobs.body.data.items[0]._id;

    await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('Cookie', [customerCookie])
      .send({ status: 'IN_PROGRESS' })
      .expect(409);

    await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('Cookie', [artisanCookie])
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('Cookie', [artisanCookie])
      .send({ status: 'DELIVERED' })
      .expect(200);

    const completed = await request(app)
      .patch(`/api/v1/jobs/${jobId}/status`)
      .set('Cookie', [customerCookie])
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(completed.body.data.status).toBe('COMPLETED');
    await expect(Job.findById(jobId).lean()).resolves.toMatchObject({ paymentStatus: 'RELEASED' });
    await expect(Transaction.find({ userId: completed.body.data.customerId._id }).lean()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'escrow_hold', amount: 900 }),
        expect.objectContaining({ type: 'escrow_release', amount: 900 }),
      ]),
    );
    await expect(Transaction.find({ userId: completed.body.data.artisanId._id }).lean()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'escrow_release', amount: 900, meta: expect.objectContaining({ direction: 'credit' }) }),
      ]),
    );
    const customerWalletAfterCompletion = await request(app).get('/api/v1/wallet').set('Cookie', [customerCookie]).expect(200);
    const artisanWalletAfterCompletion = await request(app).get('/api/v1/wallet').set('Cookie', [artisanCookie]).expect(200);
    expect(customerWalletAfterCompletion.body.data.escrowBalance).toBe(0);
    expect(artisanWalletAfterCompletion.body.data.availableBalance).toBe(900);
  });
});
