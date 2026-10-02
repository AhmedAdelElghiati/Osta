import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Request {
  id: string;
  title: string;
  client: string;
  area: string;
  dist: string;
  distKm: number;
  budget: number | null;
  posted: string;
  fresh: boolean;
  photos: number;
  when: string;
  status: 'open' | 'assigned';
  applied: boolean;
  desc: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {

  /** طلب جديد وصل لايف */
  arrived$ = new Subject<Request>();

  requests: Request[] = [
    { id: 'C101', title: 'تسريب مياه تحت أرضية المطبخ', client: 'أ. محمد سعيد', area: 'طنطا — شارع البحر', dist: '1.8 كم', distKm: 1.8, budget: 1500, posted: 'قبل 40 دقيقة', fresh: true, photos: 2, when: 'بأسرع وقت', status: 'open', applied: false,
      desc: 'تسريب مياه مستمر من تحت أرضية المطبخ — الفاتورة بتزيد الشهر ده. محتاج كشف بالأجهزة وإصلاح من المصدر بدون تكسير أكتر من اللازم.' },
    { id: 'C102', title: 'تركيب سخان غاز + تمديدات الحمام', client: 'أ. كريم فؤاد', area: 'طنطا — شارع النكلا', dist: '2.5 كم', distKm: 2.5, budget: 4200, posted: 'قبل 3 ساعات', fresh: false, photos: 1, when: 'غداً', status: 'open', applied: true,
      desc: 'تركيب سخان غاز 50 لتر جديد مع تمديدات المياه الساخنة للحمام والمطبخ، والعميل هيوفر السخان نفسه.' },
    { id: 'C103', title: 'تأسيس سباكة شقة جديدة 140م', client: 'أ. أحمد عثمان', area: 'طنطا — عمارات الأول', dist: '4 كم', distKm: 4, budget: 25000, posted: 'قبل 5 ساعات', fresh: false, photos: 3, when: 'هذا الأسبوع', status: 'open', applied: true,
      desc: 'تأسيس سباكة كامل لشقة 140م على مرحلة التشطيب — نقاط مياه ودورات مياه ومطبخ. يفضل الأسطى اللي عنده فريق وخبرة تأسيس.' },
    { id: 'C104', title: 'تغيير مواسير المياه (حديد لـ PPR)', client: 'أ. سامح لطفي', area: 'المحلة الكبرى', dist: '18 كم', distKm: 18, budget: 9000, posted: 'أمس', fresh: false, photos: 4, when: 'هذا الأسبوع', status: 'open', applied: true,
      desc: 'شقة قديمة مواسيرها حديد متهالك — محتاجين تغيير كامل بمواسير PPR مع اختبار ضغط قبل التسليم.' },
    { id: 'C105', title: 'معالجة ضغط مياه ضعيف بالعمارة', client: 'إدارة عمارة 12', area: 'طنطا — القسطاني', dist: '0.9 كم', distKm: 0.9, budget: null, posted: 'قبل يومين', fresh: false, photos: 0, when: 'بأسرع وقت', status: 'open', applied: true,
      desc: 'ضغط المياه ضعيف في الأدوار العليا للعمارة (5 أدوار). محتاجين فحص سبب المشكلة وحل جذري — الميزانية مرنة حسب التشخيص.' },
    { id: 'C106', title: 'تركيب مطبخ + توصيلات مياه', client: 'أ. هدى سامي', area: 'طنطا — شارع عبد العزيز', dist: '3.2 كم', distKm: 3.2, budget: 3500, posted: 'أمس', fresh: false, photos: 2, when: 'هذا الأسبوع', status: 'open', applied: false,
      desc: 'تركيب مطبخ جديد مع توصيلات المياه والصرف للمغسلة وغسالة الأطباق وشنبر المياه.' }
  ];

  constructor() {
    // محاكاة طلبات جديدة بتوصل لايف (زي المرجع) — احذفها لما توصل بـ API حقيقي
    setTimeout(() => this.arrive({
      id: 'C107', title: 'كسر وتغيير نقطة مياه بالمطبخ', client: 'أ. وليد عزمي', area: 'طنطا — شارع النكلا',
      dist: '2.1 كم', distKm: 2.1, budget: 1200, posted: 'الآن', fresh: true, photos: 1, when: 'بأسرع وقت',
      status: 'open', applied: false,
      desc: 'محتاج كسر نقطة مياه قديمة بالمطبخ وتركيب مغسلة جديدة مع تغيير الشنابر.'
    }), 25000);

    setTimeout(() => this.arrive({
      id: 'C108', title: 'تركيب 3 عدادات مياه جديدة', client: 'إدارة عمارة 45', area: 'طنطا — القسطاني',
      dist: '1.2 كم', distKm: 1.2, budget: 2600, posted: 'الآن', fresh: true, photos: 2, when: 'هذا الأسبوع',
      status: 'open', applied: false,
      desc: 'تركيب 3 عدادات مياه جديدة بشهادة معاينة للشقق — العدادات متوفرة من إدارة العمارة.'
    }), 55000);
  }

  get openRequests() {
    return this.requests.filter(r => r.status === 'open');
  }

  /** المقترحة للهوم: مفتوحة ومقدمتش عليها — أول 3 */
  get suggested() {
    return this.openRequests.filter(r => !r.applied).slice(0, 3);
  }

  arrive(r: Request) {
    this.requests.unshift(r);
    this.arrived$.next(r);
  }

  setApplied(id: string, applied: boolean) {
    const r = this.requests.find(x => x.id === id);
    if (r) r.applied = applied;
  }

  markAssigned(id: string) {
    const r = this.requests.find(x => x.id === id);
    if (r) r.status = 'assigned';
  }
}