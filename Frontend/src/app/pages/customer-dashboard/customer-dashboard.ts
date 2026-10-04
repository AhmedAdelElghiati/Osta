import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { Auth, CurrentUser } from '../../services/auth';
import { Craft, RequestVm, ServiceRequests } from '../../services/service-requests';
import { Marketplace, OfferVm } from '../../services/marketplace';

import { DashboardHome } from './components/dashboard-home/dashboard-home';
import { DashboardRequests } from './components/dashboard-requests/dashboard-requests';
import { DashboardOffers } from './components/dashboard-offers/dashboard-offers';
import { DashboardWallet } from './components/dashboard-wallet/dashboard-wallet';
import { DashboardSupport } from './components/dashboard-support/dashboard-support';
import { DashboardSettings } from './components/dashboard-settings/dashboard-settings';
import { DashboardChat } from './components/dashboard-chat/dashboard-chat';

@Component({
  selector: 'app-customer-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DashboardHome,
    DashboardRequests,
    DashboardOffers,
    DashboardWallet,
    DashboardSupport,
    DashboardSettings,
    DashboardChat,
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
    private marketplace: Marketplace,
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
  craftsLoading = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['page'] === 'chat') this.activePage = 'chat';
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
        this.requestDetails = Object.fromEntries(requests.map(request => [request.id, request]));
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
    this.loadCrafts();
    this.loadWallet();
    this.loadNotifications();
    this.loadRecentOffers();
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

  loadCrafts(): void {
    this.craftsLoading = true;
    this.requestsApi.loadCrafts().subscribe({
      next: (crafts) => {
        this.craftsLoading = false;
        if (
          this.selectedCraft &&
          !crafts.some((craft) => craft.id === this.selectedCraft || craft.slug === this.selectedCraft)
        ) {
          this.selectedCraft = '';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.craftsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
  requestDetails: any = {};
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
  notifications: any[] = [];
  notificationsLoading = false;

  loadNotifications() {
    this.notificationsLoading = true;
    this.marketplace.notifications().subscribe({
      next: (res) => {
        this.notifications = res.data || [];
        this.notificationsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notificationsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get unreadNotificationsCount() {
    return this.notifications.filter((notification) => !notification.isRead).length;
  }
  closeNotifications() {
    this.notificationsOpen = false;
  }
  
  markAllNotificationsRead() {
    this.marketplace.markAllNotificationsRead().subscribe(() => {
      this.notifications.forEach((notification) => {
        notification.isRead = true;
      });
      this.cdr.markForCheck();
    });
  }

  markNotificationRead(notification: any) {
    if (notification.isRead) return;
    this.marketplace.markNotificationRead(notification._id).subscribe(() => {
      notification.isRead = true;
      this.cdr.markForCheck();
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
  // Wallet functionality
  escrowAmount = 0;
  walletBalance = 0;
  transactions: any[] = [];

  loadWallet() {
    this.marketplace.wallet().subscribe((res) => {
      this.walletBalance = res.data.availableBalance || 0;
      this.escrowAmount = res.data.escrowBalance || 0;
      this.transactions = res.data.transactions || [];
      this.cdr.markForCheck();
    });
  }

  recentOffers: OfferVm[] = [];
  offersCount = 0;
  loadRecentOffers() {
    this.marketplace.myOffers().subscribe((res) => {
      const data = res?.data;
      this.recentOffers = Array.isArray(data) ? data : data?.items ?? [];
      this.offersCount = this.recentOffers.length;
      this.cdr.markForCheck();
    });
  }

  get offersForReview(): OfferVm[] {
    return this.recentOffers.filter(
      (offer) =>
        offer.status === 'PENDING' &&
        ['PUBLISHED', 'OFFER_RECEIVED'].includes(offer.requestId?.status),
    );
  }

  acceptOffer(offerId: string) {
    this.marketplace.acceptOffer(offerId).subscribe({
      next: () => {
        this.showToast('تم قبول العرض بنجاح.', 'success');
        this.reloadRequests();
        this.loadRecentOffers();
        this.loadWallet();
      },
      error: (error) => {
        this.showToast(error?.error?.message || 'تعذر قبول العرض.', 'error');
      }
    });
  }

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
    this.loadCrafts();
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
    if (this.newRequestTitle.trim().length < 3 || this.newRequestTitle.trim().length > 200) return 'عنوان الطلب من 3 إلى 200 حرف.';
    if (this.newRequestDescription.trim().length < 10 || this.newRequestDescription.trim().length > 5000)
      return 'تفاصيل الطلب من 10 إلى 5000 حرف.';
    if (this.newRequestCity.trim().length < 2) return 'من فضلك اكتب المحافظة.';
    if (this.newRequestLocation.trim().length < 2) return 'من فضلك اكتب المنطقة.';
    if (this.newRequestAddress.trim().length < 5) return 'العنوان لازم يكون 5 حروف على الأقل.';
    const min = Number(this.newRequestBudgetMin);
    const max = Number(this.newRequestBudget);
    if (this.newRequestBudgetMin === null || this.newRequestBudget === null || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) return 'الميزانية غير صحيحة.';
    if (max < min) return 'الحد الأقصى للميزانية لازم يكون أكبر من أو يساوي الحد الأدنى.';
    if (this.newRequestWhen === 'أفضل تحديد موعد' && !this.newRequestDate) {
      return 'من فضلك اختار تاريخ الموعد.';
    }
    if (this.newRequestWhen === 'أفضل تحديد موعد' && new Date(this.newRequestDate).getTime() <= Date.now()) return 'اختار تاريخًا في المستقبل.';
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

    const selectedCraft = this.crafts.find((craft) => craft.id === this.selectedCraft || craft.slug === this.selectedCraft);
    if (!selectedCraft) {
      this.newRequestError = 'نوع الخدمة مش متاح دلوقتي. جددنا القائمة، اختار نوع الخدمة مرة تانية.';
      this.selectedCraft = '';
      this.loadCrafts();
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
          craftId: selectedCraft.id,
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
          if (this.newRequestError.includes('نوع الخدمة')) {
            this.selectedCraft = '';
            this.loadCrafts();
          }
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

  offerWasAccepted(_requestId: string) {
    this.reloadRequests();
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
    const offer = this.recentOffers.find(item => item._id === name || item.artisanId?.name === name);
    if (!offer) return;
    this.selectedQuote = {
      name: offer.artisanId?.name || '',
      subtitle: 'تفاصيل عرض السعر',
      items: offer.items || [],
      total: offer.price,
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

    const action = this.confirmAction === 'cancel'
      ? this.requestsApi.cancel(this.selectedRequest.id, 'تم الإلغاء بواسطة العميل')
      : this.requestsApi.republish(this.selectedRequest.id);
    action.subscribe({ next: () => { this.closeConfirm(); this.reloadRequests(); },
      error: err => this.showToast(err.error?.message || 'تعذر تنفيذ العملية.') });
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

  openRequestConversation(conversation: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 'chat', conversation, newRequest: null },
      queryParamsHandling: 'merge',
    }).then(navigated => {
      if (navigated) { this.showPage('chat'); this.cdr.markForCheck(); }
    });
  }
  submitRating() {
    if (!this.selectedRating || !this.selectedRatingRequest) {
      return;
    }
    const requestId = this.selectedRatingRequest.id;
    this.marketplace.submitReview(requestId, this.selectedRating, this.ratingComment).subscribe({
      next: () => { this.rated[requestId] = true; this.closeRating(); this.reloadRequests(); this.showToast('تم إرسال تقييمك.'); },
      error: err => this.showToast(err.error?.message || 'تعذر إرسال التقييم.'),
    });
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
    if (!this.selectedRequest) return;
    this.requestsApi.schedule(this.selectedRequest.id, this.scheduleDate, this.scheduleTime).subscribe({
      next: () => { this.closeSchedule(); this.reloadRequests(); this.showToast('تم حفظ موعد المعاينة.'); },
      error: err => this.showToast(err.error?.message || 'تعذر حفظ الموعد.'),
    });
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
