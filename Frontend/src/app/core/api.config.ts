// نقطة واحدة لعنوان الباك اند بدل ما يتكرر في أكتر من ملف.
// TODO: لما نعمل environment.ts / environment.prod.ts ننقلها هناك.
export const API_ORIGIN = 'http://localhost:5001';
export const API_BASE_URL = `${API_ORIGIN}/api`;

// الباك اند حاليًا مفيهوش endpoint لقائمة الحرف (Crafts).
// لما أحمد يضيف مثلًا GET /api/v1/crafts غيّر القيمة دي لـ `${API_BASE_URL}/v1/crafts`
// والفرونت هيستخدمه تلقائيًا (بيقبل data كـ array أو { items }).
// لحد ذلك الحرف بتتجاب من طلبات العميل نفسه (craftId المتعمّل populate).
export const CRAFTS_ENDPOINT: string | null = null;
