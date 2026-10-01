import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Auth, CurrentUser } from '../../services/auth';
import { Craft, RequestVm, ServiceRequests } from '../../services/service-requests';

import { DashboardHome } from './components/dashboard-home/dashboard-home';
import { DashboardRequests } from './components/dashboard-requests/dashboard-requests';
import { DashboardOffers } from './components/dashboard-offers/dashboard-offers';
import { DashboardWallet } from './components/dashboard-wallet/dashboard-wallet';
import { DashboardSupport } from './components/dashboard-support/dashboard-support';
import { DashboardSettings } from './components/dashboard-settings/dashboard-settings';

@Component({
  selector: 'app-customer-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    DashboardHome,
    DashboardRequests,
    DashboardOffers,
    DashboardWallet,
    DashboardSupport,
    DashboardSettings,
  ],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css',
})
export class CustomerDashboard implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private requestsApi: ServiceRequests,
    private cdr: ChangeDetectorRef,
  ) {}

  private subs = new Subscription();

  // بيانات اليوزر الحقيقية من /auth/me
  user: { name: string; email: string } = { name: '', email: '' };
  get userInitials() {
    const parts = (this.user.name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '؟';
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join(' ');
  }

  // الطلبات الحقيقية من /api/v1/requests/me
  requests: RequestVm[] = [];
  requestsLoading = true;
  requestsError = '';
  crafts: Craft[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['newRequest'] === 'true') {
        this.openNewRequest();
      }
    });
    this.subs.add(
      this.auth.currentUser$.subscribe((user: CurrentUser | null) => {
        if (user) {
          this.user = { name: user.name, email: user.email };
        }
        this.cdr.markForCheck();
      }),
    );

    this.subs.add(
      this.requestsApi.requests$.subscribe((requests) => {
        this.requests = requests;
        this.cdr.markForCheck();
      }),
    );

    this.subs.add(
      this.requestsApi.crafts$.subscribe((crafts) => {
        this.crafts = crafts;
        this.cdr.markForCheck();
      }),
    );

    this.reloadRequests();
    this.requestsApi.loadCrafts().subscribe();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.requestsApi.reset();
  }

  reloadRequests(): void {
    this.requestsLoading = true;
    this.requestsError = '';
    this.requestsApi.loadRequests().subscribe({
      next: () => {
        this.requestsLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.requestsLoading = false;
        this.requestsError = error?.error?.message || 'تعذر تحميل الطلبات، حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }
  // لسه مفيش endpoint للعروض في الباك اند، فبنسيب الحقل فاضي هنا.
  requestDetails: any = {};
  offerGroup = 'g-kitchen';
  offerGroups = [
    {
      id: 'g-kitchen',
      title: 'تجديد مطبخ أرو أمريكي',
      status: '3 عروض',
      budget: 12000,
      location: 'مدينة نصر',
      photos: 4,
      expires: 'متبقي 3 أيام',
    },
    {
      id: 'g-ac',
      title: 'تركيب تكييفين سبليت',
      status: '2 عروض',
      budget: 20000,
      location: 'مدينة نصر',
      photos: 2,
      expires: 'متبقي يومين',
    },
    {
      id: 'g-bath',
      title: 'صيانة سباكة ومحابس الحمام',
      status: 'مقبول',
      budget: 1400,
      location: 'مدينة نصر',
      photos: 0,
      expires: '',
    },
  ];
  kitchenOffers = [
    {
      name: 'الأسطى محمود الشريف',
      subtitle: 'كبير نجارين معتمد',
      rating: 4.9,
      price: 10500,
      duration: '8 أيام',
      warranty: 'سنة',
      disassembly: 'متاح',
    },
    {
      name: 'ورشة الأمانة للديكور',
      subtitle: 'موبيليا معتمدة',
      rating: 4.7,
      price: 9800,
      duration: '10 أيام',
      warranty: '6 شهور',
      disassembly: 'متاح',
    },
    {
      name: 'ورشة حديث للموبيليا',
      subtitle: 'نجارة وديكور',
      rating: 4.6,
      price: 11200,
      duration: '7 أيام',
      warranty: 'سنة',
      disassembly: 'غير متاح',
    },
  ];
  acOffers = [
    {
      name: 'شركة برنس للتكييف',
      subtitle: 'متخصص تكييف وتبريد',
      rating: 4.8,
      price: 17900,
      duration: 'يوم واحد',
      warranty: 'سنتين',
      installation: 'شامل التركيب',
    },
    {
      name: 'الأسطى سيد التكييفات',
      subtitle: 'فني تكييف معتمد',
      rating: 4.6,
      price: 18600,
      duration: 'يومين',
      warranty: 'سنة',
      installation: 'شامل التركيب',
    },
  ];
  selectedCraft = ''; // craftId الحقيقي
  newRequestTitle = '';
  newRequestDescription = '';
  newRequestLocation = '';
  toastOpen = false;
  toastMessage = '';
  ratingModalOpen = false;
  selectedRatingRequest: any = null;
  selectedRating = 0;
  ratingComment = '';
  rated: { [key: string]: boolean } = {};
  newRequestBudget: number | null = null; // الحد الأقصى
  newRequestBudgetMin: number | null = null;
  newRequestCity = '';
  newRequestAddress = '';
  newRequestDate = '';
  newRequestTime = '';
  newRequestFiles: File[] = [];
  newRequestSubmitting = false;
  newRequestError = '';
  newRequestWhen = 'بأسرع وقت ممكن';
  newRequestReceive = 'all';
  termsAccepted = false;
  confirmModalOpen = false;
  confirmAction = '';
  confirmTitle = '';
  confirmMessage = '';
  activePage = 'home';
  sidebarOpen = false;
  notificationsOpen = false;
  notifications = [
    {
      icon: 'bi-tag',
      title: 'عرض جديد',
      description: 'على «تركيب تكييفين سبليت»',
      details: 'الأسطى سيد التكييفات · 18,600 ج.م',
      time: 'قبل 10 دقائق',
      read: false,
    },
    {
      icon: 'bi-chat',
      title: 'رسالة جديدة',
      description: 'من الأسطى إبراهيم صقر',
      details: '"هرجع أحدثك بعد الضهر"',
      time: 'قبل ساعة',
      read: false,
    },
    {
      icon: 'bi-calendar-check',
      title: 'تأكيد موعد المعاينة',
      description: 'تأسيس إضاءة سمارت هوم',
      details: 'اليوم 6:00 م',
      time: '',
      read: true,
    },
    {
      icon: 'bi-file-earmark-text',
      title: 'مقايسة جديدة',
      description: 'من ورشة الأمانة',
      details: 'تجديد مطبخ أرو أمريكي · 9,800 ج.م',
      time: 'أمس',
      read: true,
    },
  ];

  get unreadNotificationsCount() {
    return this.notifications.filter((notification) => !notification.read).length;
  }
  closeNotifications() {
    this.notificationsOpen = false;
  }
  markAllNotificationsRead() {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });
  }
  requestFilter = 'all';
  selectedRequest: any = null;

  //////التنقل العام
  showPage(page: string) {
    this.activePage = page;
    this.closeSidebar();
    this.notificationsOpen = false;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  globalSearch = '';

  searchRequests() {
    const search = this.globalSearch.trim();
    if (!search) {
      return;
    }
    this.activePage = 'requests';
    this.closeSidebar();
    this.notificationsOpen = false;
  }
  /////////////تحديث الحاله والارقام
  get activeJobsCount() {
    return this.requests.filter((request) => request.status === 'active').length;
  }

  get completedJobsCount() {
    return this.requests.filter((request) => request.status === 'done').length;
  }
  // مفيش endpoint للمحفظة/الضمان في الباك اند لسه.
  escrowAmount = 0;
  walletBalance = 0;

  get activeRequests() {
    return this.requests.filter((request) => request.status === 'active');
  }
  ///////////إنشاء طلب جديد
  resetNewRequest() {
    this.selectedCraft = '';
    this.newRequestTitle = '';
    this.newRequestDescription = '';
    this.newRequestLocation = '';
    this.newRequestCity = '';
    this.newRequestAddress = '';
    this.newRequestBudget = null;
    this.newRequestBudgetMin = null;
    this.newRequestWhen = 'بأسرع وقت ممكن';
    this.newRequestDate = '';
    this.newRequestTime = '';
    this.newRequestFiles = [];
    this.newRequestError = '';
    this.newRequestReceive = 'all';
    this.termsAccepted = false;
  }
  newRequestOpen = false;
  openNewRequest() {
    this.resetNewRequest();
    this.newRequestError = '';
    this.newRequestOpen = true;
    // لو اليوزر سجّل محافظة وقت التسجيل نملى بيها الحقل تلقائيًا
    const savedLocation = this.auth.currentUserValue?.location;
    if (savedLocation) {
      this.newRequestCity = savedLocation;
    }
    // لو قائمة الحرف لسه فاضية نحاول نجيبها تاني
    if (!this.crafts.length) {
      this.requestsApi.loadCrafts().subscribe();
    }
  }

  // تاريخ بكرة (محلي) بصيغة YYYY-MM-DD
  private dateOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  craftIcon(slug: string): string {
    const icons: Record<string, string> = {
      plumbing: 'bi-droplet',
      electricity: 'bi-lightbulb',
      carpentry: 'bi-hammer',
      painting: 'bi-paint-bucket',
      metalwork: 'bi-gear-wide-connected',
      'air-conditioning': 'bi-snow',
      tiling: 'bi-grid-3x3-gap',
      'appliance-repair': 'bi-tools',
    };
    return icons[slug] ?? 'bi-tools';
  }

  get minPreferredDate(): string {
    return this.dateOffset(1);
  }

  onRequestFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = '';

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const valid: File[] = [];
    for (const file of picked) {
      if (!allowed.includes(file.type)) {
        this.newRequestError = 'الصور لازم تكون JPG أو PNG أو WebP.';
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.newRequestError = 'حجم الصورة لازم يكون 5 ميجابايت أو أقل.';
        continue;
      }
      valid.push(file);
    }
    this.newRequestFiles = [...this.newRequestFiles, ...valid].slice(0, 10);
  }

  removeRequestFile(index: number) {
    this.newRequestFiles = this.newRequestFiles.filter((_, i) => i !== index);
  }

  get canSubmitNewRequest(): boolean {
    return (
      !!this.selectedCraft &&
      !!this.newRequestTitle.trim() &&
      !!this.newRequestDescription.trim() &&
      !!this.newRequestCity.trim() &&
      !!this.newRequestLocation.trim() &&
      !!this.newRequestAddress.trim() &&
      this.newRequestBudget !== null &&
      this.newRequestBudgetMin !== null &&
      this.termsAccepted &&
      !this.newRequestSubmitting
    );
  }

  // رسائل التحقق بنفس قواعد الباك اند (Joi) عشان اليوزر يشوف المشكلة قبل الإرسال
  private validateNewRequest(): string {
    if (this.newRequestTitle.trim().length < 3) return 'عنوان الطلب لازم يكون 3 حروف على الأقل.';
    if (this.newRequestDescription.trim().length < 10)
      return 'تفاصيل الطلب لازم تكون 10 حروف على الأقل.';
    if (this.newRequestCity.trim().length < 2) return 'من فضلك اكتب المحافظة.';
    if (this.newRequestLocation.trim().length < 2) return 'من فضلك اكتب المنطقة.';
    if (this.newRequestAddress.trim().length < 5) return 'العنوان لازم يكون 5 حروف على الأقل.';
    const min = Number(this.newRequestBudgetMin);
    const max = Number(this.newRequestBudget);
    if (isNaN(min) || isNaN(max) || min < 0 || max < 0) return 'الميزانية غير صحيحة.';
    if (max < min) return 'الحد الأقصى للميزانية لازم يكون أكبر من أو يساوي الحد الأدنى.';
    if (this.newRequestWhen === 'أفضل تحديد موعد' && !this.newRequestDate) {
      return 'من فضلك اختار تاريخ الموعد.';
    }
    return '';
  }

  submitNewRequest() {
    if (!this.canSubmitNewRequest) {
      return;
    }

    const validationMessage = this.validateNewRequest();
    if (validationMessage) {
      this.newRequestError = validationMessage;
      return;
    }

    let preferredDate: string | undefined;
    let preferredTime: string | undefined;
    if (this.newRequestWhen === 'غدًا') {
      preferredDate = this.dateOffset(1);
    } else if (this.newRequestWhen === 'خلال هذا الأسبوع') {
      preferredDate = this.dateOffset(3);
    } else if (this.newRequestWhen === 'أفضل تحديد موعد') {
      preferredDate = this.newRequestDate;
      preferredTime = this.newRequestTime || undefined;
    }

    this.newRequestError = '';
    this.newRequestSubmitting = true;

    this.requestsApi
      .create(
        {
          title: this.newRequestTitle.trim(),
          description: this.newRequestDescription.trim(),
          craftId: this.selectedCraft,
          location: {
            city: this.newRequestCity.trim(),
            area: this.newRequestLocation.trim(),
            address: this.newRequestAddress.trim(),
          },
          budget: { min: Number(this.newRequestBudgetMin), max: Number(this.newRequestBudget) },
          preferredDate,
          preferredTime,
        },
        this.newRequestFiles,
        true,
      )
      .subscribe({
        next: () => {
          this.newRequestSubmitting = false;
          this.closeNewRequest();
          this.selectedRequest = null;
          this.activePage = 'requests';
          this.resetNewRequest();
          this.showToast('تم نشر طلبك بنجاح');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.newRequestSubmitting = false;
          this.newRequestError = error?.error?.message || 'تعذر نشر الطلب، حاول مرة أخرى.';
          // ممكن الطلب يكون اتحفظ كمسودة (مثلًا فشل رفع الصور) فنحدّث القائمة
          this.reloadRequests();
          this.cdr.markForCheck();
        },
      });
  }

  toastType: 'success' | 'error' = 'success';
  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastType = type;
    this.toastMessage = message;
    this.toastOpen = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastOpen = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  closeNewRequest() {
    this.newRequestOpen = false;
  }

  get requestsCount() {
    return this.requests.length;
  }

  offerWasAccepted(groupId: string) {
    const group = this.offerGroups.find((item) => item.id === groupId);
    if (group) {
      group.status = 'مقبول';
    }
  }
  get offersCount() {
    return this.offerGroups.filter((group) => group.status.includes('عروض')).length;
  }
  //////////////Accept Offer Modal.
  acceptModalOpen = false;
  selectedOffer = {
    name: '',
    price: 0,
    duration: '',
  };

  openAccept(name: string, price: number, duration: string) {
    this.selectedOffer = {
      name,
      price,
      duration,
    };
    this.acceptModalOpen = true;
  }

  closeAcceptModal() {
    this.acceptModalOpen = false;
  }

  confirmAccept() {
    console.log('Accepted offer:', this.selectedOffer);
    this.acceptModalOpen = false;
  }

  ///////////////////Quote Modal
  quoteModalOpen = false;
  selectedQuote = {
    name: '',
    subtitle: '',
    items: [] as { name: string; price: number }[],
    total: 0,
  };

  openQuote(name: string) {
    this.selectedQuote = {
      name: name,
      subtitle: 'تفاصيل عرض السعر',
      items: [
        { name: 'فك وتركيب المطبخ', price: 2500 },
        { name: 'أعمال النجارة والتجديد', price: 5200 },
        { name: 'المفصلات والإكسسوارات', price: 1200 },
        { name: 'التسليم والتركيب النهائي', price: 900 },
      ],
      total: 9800,
    };
    this.quoteModalOpen = true;
  }

  closeQuoteModal() {
    this.quoteModalOpen = false;
  }

  /////////////////تفاصيل الطلب Request Details Component
  openRequestDetails(request: any) {
    this.selectedRequest = request;
    this.activePage = 'requests';
  }
  openRequestDetailsById(requestId: string) {
    const request = this.requests.find((item: any) => item.id === requestId);

    if (!request) {
      return;
    }

    this.selectedRequest = request;
    this.activePage = 'requests';
  }

  get currentRequestDetails() {
    return this.requestDetails[this.selectedRequest?.id];
  }
  openConfirm(action: string, title: string, message: string) {
    this.confirmAction = action;
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmModalOpen = true;
  }

  closeConfirm() {
    this.confirmModalOpen = false;
  }
  confirmActionHandler() {
    if (!this.selectedRequest) {
      return;
    }

    if (this.confirmAction === 'cancel') {
      this.selectedRequest.status = 'cancelled';
      this.selectedRequest.statusText = 'ملغاة';
      this.closeConfirm();
      this.showPage('requests');
      console.log('Request cancelled');
    }

    if (this.confirmAction === 'republish') {
      this.selectedRequest.status = 'waiting';
      this.selectedRequest.statusText = 'في انتظار العروض';
      this.closeConfirm();
      this.showPage('requests');
      console.log('Request republished');
    }
  }
  openRating(request: any) {
    this.selectedRatingRequest = request;
    this.selectedRating = 0;
    this.ratingComment = '';
    this.ratingModalOpen = true;
  }

  closeRating() {
    this.ratingModalOpen = false;
  }

  setRating(rating: number) {
    this.selectedRating = rating;
  }

  getRatingLabel(): string {
    switch (this.selectedRating) {
      case 1:
        return 'تجربة سيئة';

      case 2:
        return 'محتاج تحسين';

      case 3:
        return 'جيد';

      case 4:
        return 'جيد جدًا';

      case 5:
        return 'ممتاز';

      default:
        return 'اختر تقييمك';
    }
  }
  handleRequestsPageChange(page: string) {
    if (page === 'new-request') {
      this.openNewRequest();
      return;
    }

    this.showPage(page);
  }
  submitRating() {
    if (!this.selectedRating || !this.selectedRatingRequest) {
      return;
    }
    const requestId = this.selectedRatingRequest.id;
    // تسجيل إن الطلب اتقيّم
    this.rated[requestId] = true;
    this.closeRating();
    this.showToast('تم إرسال تقييمك بنجاح');
  }

  scheduleModalOpen = false;
  scheduleDate = '';
  scheduleTime = '';
  openSchedule() {
    this.scheduleDate = '';
    this.scheduleTime = '';
    this.scheduleModalOpen = true;
  }

  closeSchedule() {
    this.scheduleModalOpen = false;
  }

  confirmSchedule() {
    if (!this.scheduleDate || !this.scheduleTime) {
      return;
    }
    this.closeSchedule();
    this.showToast('تم تحديد موعد المعاينة بنجاح');
  }
  invoiceModalOpen = false;
  openInvoice() {
    this.invoiceModalOpen = true;
  }

  closeInvoice() {
    this.invoiceModalOpen = false;
  }
  // Delete Account
  accountDeleted = false;
  deleteAccount() {
    this.accountDeleted = true;
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
