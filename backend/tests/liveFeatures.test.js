const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Artisan = require('../src/models/Artisan');
const Transaction = require('../src/models/Transaction');
const Notification = require('../src/models/Notification');

jest.setTimeout(30000);
let mongo;
let customer;
let other;
let artisan;
let admin;
let customerId;
let artisanId;
const register = async (email, phone, role) => {
  await request(app).post('/api/auth/register').send({ name: 'Test Account', email, phone,
    role, password: 'StrongPass123!', ...(role === 'artisan' ? { profession: 'Plumber', experienceYears: 8,
      skills: ['plumbing'], serviceAreas: ['Cairo'], hourlyRate: 150 } : {}) }).expect(201);
  return login(email);
};
const login = async (email) => {
  const result = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' }).expect(200);
  return { cookie: result.headers['set-cookie'][0].split(';')[0], id: result.body.data.user.id };
};
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const c = await register('real-customer@example.com', '01011111001', 'customer');
  customer = c.cookie; customerId = c.id;
  other = (await register('real-other@example.com', '01011111002', 'customer')).cookie;
  const a = await register('real-artisan@example.com', '01011111003', 'artisan');
  artisan = a.cookie; artisanId = a.id;
  await User.create({ name: 'Test Admin', email: 'real-admin@example.com', phone: '01011111004', role: 'admin', password: 'StrongPass123!' });
  admin = (await login('real-admin@example.com')).cookie;
});
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

test('admin bans customers and artisans, revokes sessions, and prevents re-registration by identity', async () => {
  const AccountBan = require('../src/models/AccountBan');
  const Session = require('../src/models/Session');
  for (const [index, role] of ['customer', 'artisan'].entries()) {
    const email = `banned-${role}@example.com`;
    const phone = `0102222200${index}`;
    const registered = await register(email, phone, role);
    const loggedIn = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' }).expect(200);
    const cookies = loggedIn.headers['set-cookie'].map(cookie => cookie.split(';')[0]);
    await request(app).patch(`/api/admin/users/${registered.id}/ban`).set('Cookie', customer).send({ banned: true, reason: 'Violation' }).expect(403);
    await request(app).patch(`/api/admin/users/${registered.id}/ban`).set('Cookie', admin).send({ banned: true, reason: ' ' }).expect(400);
    const banned = await request(app).patch(`/api/admin/users/${registered.id}/ban`).set('Cookie', admin).send({ banned: true, reason: 'Repeated violations' }).expect(200);
    expect(banned.body.data).toMatchObject({ isBanned: true, isActive: false });
    expect(banned.body.data.password).toBeUndefined();
    expect(await Session.countDocuments({ userId: registered.id, revokedAt: null })).toBe(0);
    await request(app).get('/api/auth/me').set('Cookie', registered.cookie).expect(403);
    await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' }).expect(403);
    await request(app).post('/api/auth/refresh').set('Cookie', cookies).expect(401);
    await request(app).patch(`/api/admin/users/${registered.id}/toggle-active`).set('Cookie', admin).expect(409);
    const body = { name: 'Another account', email: email.toUpperCase(), phone: '01099999990', role: 'customer', password: 'StrongPass123!' };
    await request(app).post('/api/auth/register').send(body).expect(403);
    await request(app).post('/api/auth/register').send({ ...body, email: `different-${role}@example.com`, phone: `+2${phone}` }).expect(403);
    const original = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(registered.id) });
    await User.collection.deleteOne({ _id: original._id });
    await request(app).post('/api/auth/register').send(body).expect(403);
    await User.collection.insertOne(original);
    await request(app).patch(`/api/admin/users/${registered.id}/ban`).set('Cookie', admin).send({ banned: false }).expect(200);
    expect(await AccountBan.exists({ userId: registered.id })).toBeNull();
    await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' }).expect(200);
    await User.deleteOne({ _id: registered.id });
    await Artisan.deleteOne({ userId: registered.id });
  }
  const adminId = (await User.findOne({ role: 'admin' }))._id;
  await request(app).patch(`/api/admin/users/${adminId}/ban`).set('Cookie', admin).send({ banned: true, reason: 'Violation' }).expect(403);
  const legacyId = 'legacy-ban-account';
  await User.collection.insertOne({ _id: legacyId, name: 'Legacy customer', email: 'legacy-ban@example.com', phone: '01033333333', role: 'customer', isActive: true });
  try {
    await request(app).patch(`/api/admin/users/${legacyId}/ban`).set('Cookie', admin).send({ banned: true, reason: 'Legacy violation' }).expect(200);
    await request(app).patch(`/api/admin/users/${legacyId}/ban`).set('Cookie', admin).send({ banned: false }).expect(200);
  } finally { await User.collection.deleteOne({ _id: legacyId }); await AccountBan.deleteOne({ userId: legacyId }); }
});

test('settings start empty, survive reload, preserve other fields, and remain private', async () => {
  const empty = await request(app).get('/api/users/me/settings').set('Cookie', customer).expect(200);
  expect(empty.body.data.addresses).toEqual([]);
  expect(empty.body.data.paymentMethods).toEqual([]);
  const addresses = [{ id: 'home', title: 'Home', address: 'Cairo street 1' }];
  await request(app).patch('/api/users/me/settings').set('Cookie', customer).send({ addresses, notifications: { messages: false } }).expect(200);
  await request(app).patch('/api/users/me/settings').set('Cookie', customer).send({ payout: { provider: 'Wallet', number: '01011111001' } }).expect(200);
  const saved = await request(app).get('/api/users/me/settings').set('Cookie', customer).expect(200);
  expect(saved.body.data.addresses[0]).toMatchObject(addresses[0]);
  expect(saved.body.data.notifications.messages).toBe(false);
  expect(saved.body.data.notifications.offers).toBe(true);
  const isolated = await request(app).get('/api/users/me/settings').set('Cookie', other).expect(200);
  expect(isolated.body.data.addresses).toEqual([]);
  await request(app).get('/api/users/me/settings').expect(401);
  await request(app).patch('/api/users/me/settings').set('Cookie', customer).send({ role: 'admin' }).expect(400);
  await request(app).patch('/api/users/me/settings').set('Cookie', customer).send({ paymentMethods: [{ id: 'card', type: 'Visa', lastFour: '1234', details: 'Card 1234', icon: 'bi-credit-card', cvv: '123' }] }).expect(400);
});

test('artisan directory and profile use saved bio, availability, portfolio and real statistics', async () => {
  await request(app).patch('/api/v1/artisans/me/profile').set('Cookie', artisan)
    .send({ bio: 'Real updated biography', isAvailable: false, portfolio: [{ title: 'Finished bathroom', image: '' }] }).expect(200);
  const profile = await request(app).get('/api/v1/artisans/me/profile').set('Cookie', artisan).expect(200);
  expect(profile.body.data.bio).toBe('Real updated biography');
  expect(profile.body.data.stats.completedJobs).toBe(0);
  expect(profile.body.data.reviews).toEqual([]);
  await request(app).get('/api/v1/artisans/me/profile').set('Cookie', customer).expect(403);
  await request(app).patch('/api/v1/artisans/me/profile').set('Cookie', artisan).send({ isVerified: true }).expect(400);
  const list = await request(app).get('/api/v1/artisans?area=Cairo&minPrice=100&maxPrice=200&minExperience=7').expect(200);
  expect(list.body.data.items).toHaveLength(1);
  expect(list.body.data.items[0]).toMatchObject({ bio: 'Real updated biography', isAvailable: false });
  expect(list.body.data.items[0].portfolio[0].title).toBe('Finished bathroom');
  const publicProfile = await request(app).get(`/api/v1/artisans/${profile.body.data._id}`).expect(200);
  expect(publicProfile.body.data.portfolio).toHaveLength(1);
  await User.findByIdAndUpdate(artisanId, { isActive: false });
  const inactive = await request(app).get('/api/v1/artisans').expect(200);
  expect(inactive.body.data.pagination.total).toBe(0);
  await request(app).get(`/api/v1/artisans/${profile.body.data._id}`).expect(404);
  await User.findByIdAndUpdate(artisanId, { isActive: true });
});

test('legacy string user IDs do not break the public directory or platform statistics', async () => {
  const legacyId = 'cr6401ile73ww806xj0ohsbm2';
  await User.collection.insertOne({ _id: legacyId, name: 'Legacy artisan', email: 'legacy@example.com',
    phone: '01099999999', role: 'artisan', isActive: true });
  try {
    const list = await request(app).get('/api/v1/artisans?sort=rating&page=1&limit=12').expect(200);
    expect(list.body.data.items).toHaveLength(1);
    await request(app).get('/api/v1/artisans?search=Legacy&area=Cairo').expect(200);
    const stats = await request(app).get('/api/v1/platform/stats').expect(200);
    expect(stats.body.data.artisans).toBe(1);
  } finally {
    await User.collection.deleteOne({ _id: legacyId });
  }
});

test('support stores tickets, real administrator replies, and enforces ownership', async () => {
  const ticket = await request(app).post('/api/v1/contact/tickets').set('Cookie', customer).send({ subject: 'Help', message: 'Payment question' }).expect(201);
  const id = ticket.body.data._id;
  await request(app).post(`/api/v1/contact/${id}/replies`).set('Cookie', other).send({ text: 'Not mine' }).expect(404);
  await request(app).post(`/api/v1/contact/${id}/replies`).set('Cookie', admin).send({ text: 'Actual support reply' }).expect(201);
  const mine = await request(app).get('/api/v1/contact/mine').set('Cookie', customer).expect(200);
  expect(mine.body.data[0].replies[0]).toMatchObject({ senderRole: 'admin', text: 'Actual support reply' });
  const theirs = await request(app).get('/api/v1/contact/mine').set('Cookie', other).expect(200);
  expect(theirs.body.data).toEqual([]);
  const inbox = await request(app).get('/api/admin/contact').set('Cookie', admin).expect(200);
  expect(inbox.body.data[0]._id).toBe(id);
  await request(app).get('/api/admin/artisans').set('Cookie', admin).expect(200);
});

test('wallet totals use all entries and withdrawal requests cannot spend the same funds twice', async () => {
  await Transaction.insertMany(Array.from({ length: 101 }, () => ({ userId: customerId, type: 'deposit', amount: 10, title: 'Confirmed transfer' })));
  const wallet = await request(app).get('/api/v1/wallet').set('Cookie', customer).expect(200);
  expect(wallet.body.data.availableBalance).toBe(1010);
  expect(wallet.body.data.transactions).toHaveLength(100);
  await request(app).post('/api/v1/wallet/deposit').set('Cookie', customer).send({ amount: 100 }).expect(503);
  const responses = await Promise.all([1, 2].map(() => request(app).post('/api/v1/wallet/withdraw').set('Cookie', customer).send({ amount: 800 })));
  expect(responses.filter(r => r.status === 201)).toHaveLength(1);
  expect(responses.find(r => r.status === 201).body.data.status).toBe('pending');
  const after = await request(app).get('/api/v1/wallet').set('Cookie', customer).expect(200);
  expect(after.body.data.availableBalance).toBe(210);
  await request(app).post('/api/v1/wallet/withdraw').set('Cookie', customer).send({ amount: 300 }).expect(409);
});

test('public statistics and notifications use persisted records', async () => {
  const stats = await request(app).get('/api/v1/platform/stats').expect(200);
  expect(stats.body.data).toMatchObject({ artisans: 1, verifiedArtisans: 0, completedJobs: 0, customers: 2, rating: null });
  const before = await request(app).get('/api/v1/notifications').set('Cookie', artisan).expect(200);
  expect(before.body.data).toEqual([]);
  const notification = await Notification.create({ userId: artisanId, title: 'Actual event', description: 'Saved event', link: '/dashboard/chat' });
  await request(app).patch(`/api/v1/notifications/${notification._id}/read`).set('Cookie', customer).expect(404);
  await request(app).patch(`/api/v1/notifications/${notification._id}/read`).set('Cookie', artisan).expect(200);
  const read = await request(app).get('/api/v1/notifications').set('Cookie', artisan).expect(200);
  expect(read.body.data[0].isRead).toBe(true);
});

test('assistant lists active services and never claims a completed payment', async () => {
  const services = await request(app).post('/api/v1/platform/assistant').send({ message: 'الخدمات المتاحة' }).expect(200);
  expect(services.body.data.reply).toContain('لا توجد خدمات مفعلة');
  const payment = await request(app).post('/api/v1/platform/assistant').send({ message: 'طرق الدفع إيه؟' }).expect(200);
  expect(payment.body.data.reply).toContain('غير متاح');
  await request(app).post('/api/v1/platform/assistant').send({ message: '' }).expect(400);
});

test('image uploads validate image bytes rather than trusting a filename', async () => {
  await request(app).post('/api/users/me/image').set('Cookie', customer)
    .attach('image', Buffer.from('not an image'), { filename: 'fake.png', contentType: 'image/png' }).expect(400);
});

test('artisan login and profile show actual reviews even when cached totals are stale', async () => {
  const Review = require('../src/models/Review');
  const reviews = await Review.create([4, 5].map(rating => ({
    requestId: new mongoose.Types.ObjectId(), artisanId, customerId, rating,
  })));
  try {
    await Artisan.updateOne({ userId: artisanId }, { $set: { rating: 0, totalReviews: 0 } });
    const logged = await request(app).post('/api/auth/login').send({ email: 'real-artisan@example.com', password: 'StrongPass123!' }).expect(200);
    expect(logged.body.data.user.artisan).toMatchObject({ rating: 4.5, totalReviews: 2 });
    const me = await request(app).get('/api/auth/me').set('Cookie', artisan).expect(200);
    expect(me.body.data.artisan).toMatchObject({ rating: 4.5, totalReviews: 2 });
    const profile = await request(app).get('/api/v1/artisans/me/profile').set('Cookie', artisan).expect(200);
    expect(profile.body.data).toMatchObject({ rating: 4.5, totalReviews: 2 });
  } finally { await Review.deleteMany({ _id: { $in: reviews.map(review => review._id) } }); }
});

test('invalid prices, ratings, profiles, contact and admin changes return validation errors', async () => {
  for (const price of [null, '', 'abc', -1, 0, {}]) {
    await request(app).post('/api/v1/offers').set('Cookie', artisan)
      .send({ requestId: String(new mongoose.Types.ObjectId()), price }).expect(400);
  }
  await request(app).post('/api/v1/offers').set('Cookie', artisan)
    .send({ requestId: String(new mongoose.Types.ObjectId()), price: 100, items: [{ name: 'Work', price: 90 }] }).expect(400);
  for (const rating of ['abc', 2.5, {}, 6]) {
    await request(app).post(`/api/v1/requests/${new mongoose.Types.ObjectId()}/review`).set('Cookie', customer).send({ rating }).expect(400);
  }
  for (const body of [{ name: '  ' }, { phone: 'abcdefghijk' }, { role: 'admin' }]) {
    await request(app).patch('/api/users/me').set('Cookie', customer).send(body).expect(400);
  }
  await request(app).patch('/api/users/me').set('Cookie', artisan).send({ hourlyRate: -1 }).expect(400);
  await request(app).post('/api/v1/contact').send({ fullName: {}, phone: '01011111001', message: 'Long enough message' }).expect(400);
  await request(app).patch(`/api/admin/contact/${new mongoose.Types.ObjectId()}`).set('Cookie', admin).send({ status: 'INVALID' }).expect(400);
  await request(app).patch(`/api/admin/artisans/${new mongoose.Types.ObjectId()}/verify`).set('Cookie', admin).send({ isVerified: 'yes' }).expect(400);
});

test('direct chat works without a job, reuses the pair, persists messages, and protects its socket room', async () => {
  const profile = await Artisan.findOne({ userId: artisanId });
  const start = () => request(app).post('/api/v1/chat/direct').set('Cookie', customer).send({ artisanId: String(profile._id) });
  const first = await start().expect(200);
  const id = first.body.data.id;
  expect((await start().expect(200)).body.data.id).toBe(id);
  await request(app).post('/api/v1/chat/direct').set('Cookie', artisan).send({ artisanId: String(profile._id) }).expect(403);
  await request(app).post('/api/v1/chat/direct').send({ artisanId: String(profile._id) }).expect(401);
  const inbox = await request(app).get('/api/v1/chat/direct').set('Cookie', artisan).expect(200);
  expect(inbox.body.data[0]._id).toBe(id);
  await request(app).get(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', other).expect(404);
  await request(app).post(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', other).send({ text: 'Private' }).expect(404);
  await request(app).post(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', customer).send({ text: 'Hello directly' }).expect(201);
  const history = await request(app).get(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', artisan).expect(200);
  expect(history.body.data[0].text).toBe('Hello directly');
  expect(history.body.data[0].jobId).toBeUndefined();

  const http = require('http');
  const { io: connect } = require('socket.io-client');
  const { attachChatSocket } = require('../src/services/chatSocket');
  const server = http.createServer(app);
  const io = attachChatSocket(server, app);
  const sockets = [];
  const event = (socket, name) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Missing ${name}`)), 5000);
    socket.once(name, value => { clearTimeout(timeout); resolve(value); });
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    for (const email of ['real-artisan@example.com', 'real-other@example.com']) {
      const login = await request(app).post('/api/auth/login').send({ email, password: 'StrongPass123!' }).expect(200);
      const socket = connect(`http://127.0.0.1:${server.address().port}`, { auth: { token: login.body.data.accessToken }, transports: ['websocket'], reconnection: false });
      sockets.push(socket);
      await event(socket, 'connect');
    }
    const joined = event(sockets[0], 'chat:joined');
    sockets[0].emit('chat:join', id);
    expect((await joined).jobId).toBe(id);
    const denied = event(sockets[1], 'chat:error');
    sockets[1].emit('chat:join', id);
    expect((await denied).message).toContain('غير مسموح');
    const received = event(sockets[0], 'chat:message');
    await request(app).post(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', customer).send({ text: 'Live direct message' }).expect(201);
    expect((await received).text).toBe('Live direct message');
    const disconnected = event(sockets[0], 'disconnect');
    await request(app).patch(`/api/admin/users/${artisanId}/ban`).set('Cookie', admin)
      .send({ banned: true, reason: 'Chat policy violation' }).expect(200);
    expect(await disconnected).toBe('io server disconnect');
    await request(app).post(`/api/v1/chat/jobs/${id}/messages`).set('Cookie', artisan).send({ text: 'Blocked message' }).expect(403);
    await request(app).patch(`/api/admin/users/${artisanId}/ban`).set('Cookie', admin).send({ banned: false }).expect(200);
  } finally {
    sockets.forEach(socket => socket.disconnect());
    await new Promise(resolve => io.close(resolve));
    app.set('io', undefined);
  }
});
