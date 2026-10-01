const dotenv = require('dotenv');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const Craft = require('../models/Craft');
const ServiceRequest = require('../models/ServiceRequest');
const RequestEvent = require('../models/RequestEvent');

dotenv.config();

const crafts = [
  ['سباكة', 'plumbing'], ['كهرباء', 'electricity'], ['نجارة', 'carpentry'], ['نقاشة', 'painting'],
  ['حدادة', 'metalwork'], ['تكييف وتبريد', 'air-conditioning'], ['سيراميك', 'tiling'], ['صيانة أجهزة', 'appliance-repair'],
];

const runSeed = async () => {
  await connectDatabase();
  let customer = await User.findOne({ email: 'customer.seed@osta.eg' });
  if (!customer) {
    customer = await User.create({ name: 'محمد السيد', email: 'customer.seed@osta.eg', phone: '01000000001', password: 'CustomerPass123!', role: 'customer', location: 'مدينة نصر' });
  }
  const craftDocs = {};
  for (const [name, slug] of crafts) craftDocs[slug] = await Craft.findOneAndUpdate({ slug }, { name, slug, isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await RequestEvent.deleteMany({ actorId: customer._id });
  await ServiceRequest.deleteMany({ customerId: customer._id });
  const data = [
    { title: 'تجديد مطبخ أرو أمريكي', description: 'عايز أغير وحدات المطبخ وأعمل سطح رخامة جديد.', craftId: craftDocs.carpentry._id, location: { city: 'القاهرة', area: 'مدينة نصر', address: 'شارع مكرم عبيد', latitude: 30.0616, longitude: 31.3383 }, preferredDate: '2026-10-12', preferredTime: '10:00', budget: { min: 8000, max: 12000, currency: 'EGP' }, status: 'DRAFT' },
    { title: 'تركيب تكييفين سبليت', description: 'محتاج فني يركب تكييفين في الشقة ويجربهم.', craftId: craftDocs['air-conditioning']._id, location: { city: 'القاهرة', area: 'التجمع الخامس', address: 'منطقة النرجس', latitude: 30.0209, longitude: 31.4098 }, preferredDate: '2026-10-05', preferredTime: '14:00', budget: { min: 1500, max: 2500, currency: 'EGP' }, status: 'PUBLISHED', publishedAt: new Date('2026-09-28T09:00:00Z') },
    { title: 'صيانة سباكة ومحابس الحمام', description: 'فيه تسريب مياه وعايز أغير محابس الحمام.', craftId: craftDocs.plumbing._id, location: { city: 'القاهرة', area: 'المعادي', address: 'شارع اللاسلكي', latitude: 29.9602, longitude: 31.2569 }, preferredDate: '2026-09-30', preferredTime: '16:30', budget: { min: 500, max: 1000, currency: 'EGP' }, status: 'CANCELLED', cancelledAt: new Date('2026-09-25T12:00:00Z'), cancellationReason: 'لقيت حل تاني' },
    { title: 'دهان شقة غرفتين', description: 'عايز دهان كامل لشقة غرفتين مع معالجة شروخ بسيطة في الحوائط.', craftId: craftDocs.painting._id, location: { city: 'الجيزة', area: 'الدقي', address: 'شارع محيي الدين أبو العز', latitude: 30.0384, longitude: 31.2118 }, preferredDate: '2026-10-18', preferredTime: '09:30', budget: { min: 4500, max: 6500, currency: 'EGP' }, status: 'PUBLISHED', publishedAt: new Date('2026-09-27T10:30:00Z') },
    { title: 'تغيير مفاتيح وكشافات', description: 'محتاج كهربائي يغير مفاتيح الكهرباء ويركب كشافين في البلكونة.', craftId: craftDocs.electricity._id, location: { city: 'القاهرة', area: 'مصر الجديدة', address: 'شارع بغداد', latitude: 30.0911, longitude: 31.3260 }, preferredDate: '2026-10-08', preferredTime: '11:00', budget: { min: 700, max: 1400, currency: 'EGP' }, status: 'DRAFT' },
    { title: 'تركيب سيراميك الحمام', description: 'عايز فك السيراميك القديم وتركيب سيراميك جديد للحمام.', craftId: craftDocs.tiling._id, location: { city: 'القاهرة', area: 'حلوان', address: 'شارع مصطفى صفوت', latitude: 29.8498, longitude: 31.3342 }, preferredDate: '2026-10-22', preferredTime: '08:30', budget: { min: 3000, max: 5000, currency: 'EGP' }, status: 'PUBLISHED', publishedAt: new Date('2026-09-26T08:15:00Z') },
    { title: 'إصلاح باب حديد البلكونة', description: 'باب البلكونة لا يغلق جيدا ويحتاج إلى لحام وضبط المفصلات.', craftId: craftDocs.metalwork._id, location: { city: 'الإسكندرية', area: 'سموحة', address: 'شارع فوزي معاذ', latitude: 31.2156, longitude: 29.9553 }, preferredDate: '2026-10-10', preferredTime: '13:00', budget: { min: 900, max: 1800, currency: 'EGP' }, status: 'CANCELLED', cancelledAt: new Date('2026-09-22T15:00:00Z'), cancellationReason: 'تم تأجيل الإصلاح' },
    { title: 'صيانة غسالة أوتوماتيك', description: 'الغسالة لا تصرف المياه وتصدر صوتا عاليا أثناء العصر.', craftId: craftDocs['appliance-repair']._id, location: { city: 'القاهرة', area: 'شبرا', address: 'شارع الترعة البولاقية', latitude: 30.0771, longitude: 31.2453 }, preferredDate: '2026-10-06', preferredTime: '17:00', budget: { min: 400, max: 900, currency: 'EGP' }, status: 'PUBLISHED', publishedAt: new Date('2026-09-29T11:45:00Z') },
    { title: 'تركيب وحدة مطبخ علوية', description: 'محتاج نجار يركب وحدة تخزين علوية ويثبتها في الحائط.', craftId: craftDocs.carpentry._id, location: { city: 'القاهرة', area: 'الرحاب', address: 'بوابة 6، عمارة 18', latitude: 30.0637, longitude: 31.4913 }, preferredDate: '2026-10-15', preferredTime: '12:30', budget: { min: 600, max: 1200, currency: 'EGP' }, status: 'DRAFT' },
    { title: 'تنظيف وصيانة تكييف', description: 'التكييف يحتاج تنظيف الفلاتر وفحص الغاز لأنه لا يبرد جيدا.', craftId: craftDocs['air-conditioning']._id, location: { city: 'القاهرة', area: 'الزمالك', address: 'شارع أبو الفدا', latitude: 30.0626, longitude: 31.2197 }, preferredDate: '2026-10-03', preferredTime: '15:30', budget: { min: 500, max: 800, currency: 'EGP' }, status: 'CANCELLED', cancelledAt: new Date('2026-09-20T09:00:00Z'), cancellationReason: 'تم الإصلاح بواسطة الضمان' },
    { title: 'إصلاح مفتاح مياه رئيسي', description: 'مفتاح المياه الرئيسي عالق ويحتاج تغييرا مع اختبار الضغط.', craftId: craftDocs.plumbing._id, location: { city: 'الجيزة', area: 'العجوزة', address: 'شارع جامعة الدول العربية', latitude: 30.0488, longitude: 31.2047 }, preferredDate: '2026-10-01', preferredTime: '10:30', budget: { min: 350, max: 700, currency: 'EGP' }, status: 'PUBLISHED', publishedAt: new Date('2026-09-30T07:30:00Z') },
    { title: 'تركيب إضاءة ليد للمكتب', description: 'عايز تركيب أربع وحدات إضاءة ليد وتنظيم الأسلاك في المكتب.', craftId: craftDocs.electricity._id, location: { city: 'القاهرة', area: 'المقطم', address: 'الهضبة الوسطى، شارع 9', latitude: 30.0048, longitude: 31.3110 }, preferredDate: '2026-10-20', preferredTime: '09:00', budget: { min: 1000, max: 1800, currency: 'EGP' }, status: 'DRAFT' },
  ];
  const requests = await ServiceRequest.insertMany(data.map((item) => ({ ...item, customerId: customer._id, receiveMode: 'OFFERS' })));
  const events = requests.flatMap((request) => {
    const seededEvents = [{ requestId: request._id, actorId: customer._id, type: 'REQUEST_CREATED' }];
    if (request.status === 'PUBLISHED') seededEvents.push({ requestId: request._id, actorId: customer._id, type: 'REQUEST_PUBLISHED' });
    if (request.status === 'CANCELLED') seededEvents.push({ requestId: request._id, actorId: customer._id, type: 'REQUEST_CANCELLED', metadata: { reason: request.cancellationReason } });
    return seededEvents;
  });
  await RequestEvent.insertMany(events);
  console.log(`Seeded ${crafts.length} crafts and ${requests.length} Egyptian service requests.`);
  process.exit(0);
};

runSeed().catch((error) => { console.error('Service Requests seed failed:', error.message); process.exit(1); });
