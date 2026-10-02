const Craft = require('../models/Craft');

const DEFAULT_CRAFTS = [
  { name: 'سباكة', slug: 'plumbing', description: 'إصلاح التسريبات وتركيب وصيانة السباكة المنزلية.' },
  { name: 'كهرباء', slug: 'electricity', description: 'أعمال الكهرباء، المفاتيح، الإضاءة، وصيانة الأعطال.' },
  { name: 'نجارة', slug: 'carpentry', description: 'تفصيل، تركيب، وإصلاح الأبواب والمطابخ والأثاث.' },
  { name: 'نقاشة ودهانات', slug: 'painting', description: 'دهانات وتشطيبات ومعالجة الشروخ والرطوبة.' },
  { name: 'حدادة', slug: 'metalwork', description: 'لحام، إصلاح، وتركيب الأبواب والشبابيك الحديد.' },
  { name: 'تكييف', slug: 'air-conditioning', description: 'تركيب وصيانة وتنظيف أجهزة التكييف.' },
  { name: 'سيراميك', slug: 'tiling', description: 'تركيب وصيانة السيراميك والبورسلين.' },
  { name: 'صيانة أجهزة', slug: 'appliance-repair', description: 'صيانة الغسالات والثلاجات والأجهزة المنزلية.' },
];

const ensureDefaultCrafts = async () => {
  await Craft.bulkWrite(
    DEFAULT_CRAFTS.map((craft) => ({
      updateOne: {
        filter: { slug: craft.slug },
        update: {
          $set: {
            name: craft.name,
            description: craft.description,
            isActive: true,
          },
          $setOnInsert: {
            slug: craft.slug,
          },
        },
        upsert: true,
      },
    })),
  );
};

const listCrafts = async (onlyActive = true) => {
  await ensureDefaultCrafts();
  const query = onlyActive ? { isActive: true } : {};
  return Craft.find(query).sort({ name: 1 }).lean();
};

const findActiveCraft = async (craftRef) => {
  await ensureDefaultCrafts();
  const value = String(craftRef ?? '').trim();
  if (!value) return null;

  const byId = await Craft.findOne({ _id: value, isActive: true }).lean();
  if (byId) return byId;

  return Craft.findOne({ slug: value.toLowerCase(), isActive: true }).lean();
};

module.exports = { DEFAULT_CRAFTS, ensureDefaultCrafts, listCrafts, findActiveCraft };
