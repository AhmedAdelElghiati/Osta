import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, map, of, switchMap, tap, catchError } from 'rxjs';
import { API_BASE_URL, API_ORIGIN, CRAFTS_ENDPOINT } from '../core/api.config';

// =========================
// الأنواع
// =========================

export type UiStatus = 'draft' | 'waiting' | 'active' | 'done' | 'cancelled';

export interface Craft {
  id: string;
  name: string;
  slug: string;
}

export interface TimelineStep {
  title: string;
  date: string;
  done: boolean;
}

// الشكل اللي الـ templates بتستخدمه (نفس أسماء الحقول القديمة + حقول جديدة)
export interface RequestVm {
  id: string; // الـ _id الحقيقي (بيتبعت للـ API)
  code: string; // رقم عرض للمستخدم: REQ-XXXXXX
  title: string;
  category: string;
  craftId: string;
  location: string; // "المنطقة، المحافظة"
  city: string;
  area: string;
  address: string;
  status: UiStatus;
  backendStatus: string;
  statusText: string;
  budget: number; // أقصى الميزانية
  budgetMin: number;
  budgetLabel: string;
  offers: number;
  icon: string;
  description: string;
  photos: string[];
  photoCount: number;
  timeline: TimelineStep[];
  craftsman: any; // لسه مفيش أسطى مرتبط بالطلب في الباك اند (null)
  preferredDate?: string;
  preferredTime?: string;
  cancellationReason?: string;
  createdAt?: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  craftId: string;
  location: { city: string; area: string; address: string };
  budget: { min: number; max: number };
  preferredDate?: string; // YYYY-MM-DD
  preferredTime?: string; // HH:mm
}

// =========================
// Mapping helpers
// =========================

const STATUS_MAP: Record<string, { ui: UiStatus; text: string }> = {
  DRAFT: { ui: 'draft', text: 'مسودة' },
  PUBLISHED: { ui: 'waiting', text: 'في انتظار العروض' },
  OFFER_RECEIVED: { ui: 'waiting', text: 'وصلت عروض' },
  OFFER_ACCEPTED: { ui: 'active', text: 'تم قبول عرض' },
  AWAITING_PAYMENT: { ui: 'active', text: 'في انتظار الدفع' },
  INSPECTION: { ui: 'active', text: 'معاينة' },
  IN_PROGRESS: { ui: 'active', text: 'جارية' },
  DELIVERED: { ui: 'active', text: 'تم التسليم' },
  COMPLETED: { ui: 'done', text: 'مكتملة' },
  CANCELLED: { ui: 'cancelled', text: 'ملغاة' },
  DISPUTED: { ui: 'active', text: 'قيد النزاع' },
  EXPIRED: { ui: 'cancelled', text: 'منتهية' },
};

const CRAFT_ICONS: Record<string, string> = {
  plumbing: 'bi-droplet',
  electricity: 'bi-lightbulb',
  carpentry: 'bi-hammer',
  painting: 'bi-paint-bucket',
  metalwork: 'bi-gear-wide-connected',
  'air-conditioning': 'bi-snow',
  tiling: 'bi-grid-3x3-gap',
  'appliance-repair': 'bi-tools',
};

const EVENT_TITLES: Record<string, string> = {
  REQUEST_CREATED: 'تم إنشاء الطلب',
  REQUEST_UPDATED: 'تم تعديل الطلب',
  REQUEST_PUBLISHED: 'تم نشر الطلب',
  REQUEST_CANCELLED: 'تم إلغاء الطلب',
  REQUEST_REPUBLISHED: 'تمت إعادة نشر الطلب',
};

const formatDateTime = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const toAbsoluteUrl = (url: string): string =>
  /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;

@Injectable({ providedIn: 'root' })
export class ServiceRequests {
  private base = `${API_BASE_URL}/v1/requests`;

  private requestsSubject = new BehaviorSubject<RequestVm[]>([]);
  requests$ = this.requestsSubject.asObservable();

  private craftsSubject = new BehaviorSubject<Craft[]>([]);
  crafts$ = this.craftsSubject.asObservable();

  private loadedSubject = new BehaviorSubject<boolean>(false);
  loaded$ = this.loadedSubject.asObservable();

  constructor(private http: HttpClient) {}

  get requests(): RequestVm[] {
    return this.requestsSubject.value;
  }

  // =========================
  // Mapping
  // =========================

  private mapRequest(raw: any): RequestVm {
    const id = String(raw._id ?? raw.id);
    const craft = raw.craftId && typeof raw.craftId === 'object' ? raw.craftId : null;
    const mapped = STATUS_MAP[raw.status] ?? { ui: 'waiting' as UiStatus, text: raw.status };
    const loc = raw.location ?? {};
    const min = Number(raw.budget?.min ?? 0);
    const max = Number(raw.budget?.max ?? 0);
    const images: any[] = Array.isArray(raw.images) ? raw.images : [];

    return {
      id,
      code: `REQ-${id.slice(-6).toUpperCase()}`,
      title: raw.title ?? '',
      category: craft?.name ?? '',
      craftId: craft ? String(craft._id) : String(raw.craftId ?? ''),
      location: [loc.area, loc.city].filter(Boolean).join('، '),
      city: loc.city ?? '',
      area: loc.area ?? '',
      address: loc.address ?? '',
      status: mapped.ui,
      backendStatus: raw.status,
      statusText: mapped.text,
      budget: max,
      budgetMin: min,
      budgetLabel:
        min === max
          ? `${max.toLocaleString('en-US')} ج.م`
          : `${min.toLocaleString('en-US')} - ${max.toLocaleString('en-US')} ج.م`,
      offers: 0, // الباك اند لسه مفيهوش عروض
      icon: CRAFT_ICONS[craft?.slug] ?? 'bi-tools',
      description: raw.description ?? '',
      photos: images.map((img) => toAbsoluteUrl(img.url)),
      photoCount: images.length,
      timeline: this.defaultTimeline(raw),
      craftsman: null,
      preferredDate: raw.preferredDate,
      preferredTime: raw.preferredTime,
      cancellationReason: raw.cancellationReason,
      createdAt: raw.createdAt,
    };
  }

  // تايم لاين مبدئي لحد ما نحمّل الأحداث الحقيقية من /timeline
  private defaultTimeline(raw: any): TimelineStep[] {
    const steps: TimelineStep[] = [
      { title: 'تم إنشاء الطلب', date: formatDateTime(raw.createdAt), done: true },
    ];
    if (raw.publishedAt) {
      steps.push({ title: 'تم نشر الطلب', date: formatDateTime(raw.publishedAt), done: true });
    }
    return steps;
  }

  private mapTimeline(events: any[], request: RequestVm): TimelineStep[] {
    const steps: TimelineStep[] = events.map((event) => {
      let title = EVENT_TITLES[event.type] ?? event.type;
      if (event.type === 'REQUEST_CANCELLED' && event.metadata?.reason) {
        title += ` (${event.metadata.reason})`;
      }
      return { title, date: formatDateTime(event.createdAt), done: true };
    });

    if (request.backendStatus === 'PUBLISHED') {
      steps.push({ title: 'استقبال العروض', date: 'في انتظار العروض', done: false });
    }
    if (request.backendStatus === 'DRAFT') {
      steps.push({ title: 'نشر الطلب', date: 'لسه ما اتنشرش', done: false });
    }
    return steps;
  }

  private updateInList(vm: RequestVm): void {
    const list = this.requests;
    const index = list.findIndex((item) => item.id === vm.id);
    if (index === -1) {
      this.requestsSubject.next([vm, ...list]);
      return;
    }
    // نحافظ على بيانات التفاصيل (التايم لاين والصور) اللي اتحملت قبل كده
    const previous = list[index];
    const merged: RequestVm = {
      ...vm,
      timeline: vm.timeline.length >= previous.timeline.length ? vm.timeline : previous.timeline,
    };
    const next = [...list];
    next[index] = merged;
    this.requestsSubject.next(next);
  }

  private deriveCrafts(rawItems: any[]): void {
    // fallback: لو endpoint الحرف فشل، استخرج الحرف من الطلبات نفسها
    const map = new Map<string, Craft>();
    this.craftsSubject.value.forEach((craft) => map.set(craft.id, craft));
    rawItems.forEach((raw) => {
      const craft = raw.craftId;
      if (craft && typeof craft === 'object' && craft._id) {
        map.set(String(craft._id), {
          id: String(craft._id),
          name: craft.name,
          slug: craft.slug,
        });
      }
    });
    if (map.size) this.craftsSubject.next(Array.from(map.values()));
  }

  // =========================
  // Crafts — GET /api/v1/crafts
  // =========================

  loadCrafts(): Observable<Craft[]> {
    return this.http.get<any>(CRAFTS_ENDPOINT, { withCredentials: true }).pipe(
      map((response) => {
        const data = response?.data;
        const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
        return items.map((item) => ({
          id: String(item._id ?? item.id),
          name: item.name,
          slug: item.slug,
        }));
      }),
      tap((crafts) => {
        if (crafts.length) this.craftsSubject.next(crafts);
      }),
      catchError(() => of(this.craftsSubject.value)),
    );
  }

  // =========================
  // Requests CRUD
  // =========================

  // بنجيب كل طلبات العميل (الباك اند أقصى limit = 100) على صفحات لو زادت.
  loadRequests(): Observable<RequestVm[]> {
    const fetchPage = (page: number): Observable<any[]> =>
      this.http
        .get<any>(`${this.base}/me`, {
          params: new HttpParams().set('page', page).set('limit', 100),
          withCredentials: true,
        })
        .pipe(
          switchMap((response) => {
            const items: any[] = response?.data?.items ?? [];
            const totalPages: number = response?.data?.pagination?.totalPages ?? 1;
            if (page >= totalPages) return of(items);
            return fetchPage(page + 1).pipe(map((rest) => [...items, ...rest]));
          }),
        );

    return fetchPage(1).pipe(
      tap((rawItems) => {
        this.deriveCrafts(rawItems);
        const previous = new Map(this.requests.map((item) => [item.id, item]));
        const mapped = rawItems.map((raw) => {
          const vm = this.mapRequest(raw);
          const old = previous.get(vm.id);
          return old && old.timeline.length > vm.timeline.length
            ? { ...vm, timeline: old.timeline }
            : vm;
        });
        this.requestsSubject.next(mapped);
        this.loadedSubject.next(true);
      }),
      map(() => this.requests),
    );
  }

  getRequest(id: string): Observable<RequestVm> {
    return this.http.get<any>(`${this.base}/${id}`, { withCredentials: true }).pipe(
      map((response) => this.mapRequest(response.data)),
      tap((vm) => this.updateInList(vm)),
    );
  }

  // يحمّل التفاصيل الكاملة: بيانات الطلب + الأحداث (timeline) + الصور كـ blob
  loadDetails(id: string): Observable<RequestVm> {
    return forkJoin({
      request: this.http.get<any>(`${this.base}/${id}`, { withCredentials: true }),
      events: this.http.get<any>(`${this.base}/${id}/timeline`, { withCredentials: true }),
    }).pipe(
      switchMap(({ request, events }) => {
        const vm = this.mapRequest(request.data);
        vm.timeline = this.mapTimeline(events.data ?? [], vm);
        return this.loadPhotoBlobs(vm.photos).pipe(
          map((photos) => ({ ...vm, photos })),
        );
      }),
      tap((vm) => this.updateInList(vm)),
    );
  }

  // الباك اند بيستخدم helmet بالإعدادات الافتراضية (Cross-Origin-Resource-Policy: same-origin)
  // فمتصفح بيمنع <img src="http://localhost:5000/uploads/..."> من صفحة على 4200.
  // طلبات fetch/XHR بتمشي بـ CORS (والباك اند عامل cors) فبنحمّل الصور كـ blob
  // ونعرضها من object URL، من غير ما نعدّل حاجة في الباك.
  private loadPhotoBlobs(urls: string[]): Observable<string[]> {
    if (!urls.length) return of([]);
    return forkJoin(
      urls.map((url) =>
        this.http.get(url, { responseType: 'blob' }).pipe(
          map((blob) => URL.createObjectURL(blob)),
          catchError(() => of(url)),
        ),
      ),
    );
  }

  create(input: CreateRequestInput, images: File[] = [], publish = true): Observable<RequestVm> {
    const body: any = {
      title: input.title,
      description: input.description,
      craftId: input.craftId,
      location: input.location,
      budget: { ...input.budget, currency: 'EGP' },
      receiveMode: 'OFFERS',
    };
    if (input.preferredDate) body.preferredDate = input.preferredDate;
    if (input.preferredTime) body.preferredTime = input.preferredTime;

    return this.http.post<any>(this.base, body, { withCredentials: true }).pipe(
      switchMap((created) => {
        const id = String(created.data._id);
        const afterImages$ = images.length ? this.uploadImages(id, images) : of(null);
        return afterImages$.pipe(
          switchMap(() =>
            publish
              ? this.http.post<any>(`${this.base}/${id}/publish`, {}, { withCredentials: true })
              : this.http.get<any>(`${this.base}/${id}`, { withCredentials: true }),
          ),
        );
      }),
      map((response) => this.mapRequest(response.data)),
      tap((vm) => this.updateInList(vm)),
    );
  }

  uploadImages(id: string, files: File[]): Observable<any> {
    const form = new FormData();
    files.forEach((file) => form.append('images', file, file.name));
    return this.http.post<any>(`${this.base}/${id}/images`, form, { withCredentials: true });
  }

  publish(id: string): Observable<RequestVm> {
    return this.http
      .post<any>(`${this.base}/${id}/publish`, {}, { withCredentials: true })
      .pipe(this.afterLifecycle());
  }

  cancel(id: string, reason: string): Observable<RequestVm> {
    return this.http
      .post<any>(`${this.base}/${id}/cancel`, { reason }, { withCredentials: true })
      .pipe(this.afterLifecycle());
  }

  republish(id: string): Observable<RequestVm> {
    return this.http
      .post<any>(`${this.base}/${id}/republish`, {}, { withCredentials: true })
      .pipe(this.afterLifecycle());
  }

  private afterLifecycle() {
    return (source: Observable<any>): Observable<RequestVm> =>
      source.pipe(
        map((response) => this.mapRequest(response.data)),
        tap((vm) => this.updateInList(vm)),
      );
  }

  // بيتنادى عند logout عشان مايفضلش داتا يوزر قديم في الذاكرة
  reset(): void {
    this.requestsSubject.next([]);
    this.craftsSubject.next([]);
    this.loadedSubject.next(false);
  }
}
