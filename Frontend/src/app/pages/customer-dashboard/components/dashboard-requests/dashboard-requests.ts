import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { RequestVm, ServiceRequests } from '../../../../services/service-requests';
import { Marketplace } from '../../../../services/marketplace';

@Component({
  selector: 'app-dashboard-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-requests.html',
  styleUrl: './dashboard-requests.css',
})
export class DashboardRequests implements OnInit, OnChanges, OnDestroy {
  @Input() selectedRequestId = '';
  @Input() searchTerm = '';
  @Input() loading = false;
  @Input() loadError = '';
  // Navigation
  // =========================
  @Output() pageChange = new EventEmitter<string>();
  @Output() retry = new EventEmitter<void>();
  @Output() toast = new EventEmitter<{ message: string; type: 'success' | 'error' }>();

  constructor(
    private requestsApi: ServiceRequests,
    private marketplace: Marketplace,
    private cdr: ChangeDetectorRef,
  ) {}

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.requestsApi.requests$.subscribe((requests) => {
        this.requests = requests;
        // لو التفاصيل مفتوحة نخليها متزامنة مع آخر نسخة من الطلب
        if (this.selectedRequest) {
          const fresh = requests.find((item) => item.id === this.selectedRequest!.id);
          if (fresh) {
            this.selectedRequest = fresh;
          }
        }
        this.openRequestedDetails();
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    // بنفتح التفاصيل بس لما الـ id المطلوب يتغير (مش مع كل تغيير في البحث)
    if (changes['selectedRequestId'] && this.selectedRequestId) {
      this.openRequestedDetails();
    }
  }

  private openRequestedDetails() {
    if (!this.selectedRequestId || this.showDetails) {
      return;
    }
    const request = this.requests.find((item) => item.id === this.selectedRequestId);
    if (request) {
      this.openRequestDetails(request);
    }
  }

  openNewRequest() {
    this.pageChange.emit('new-request');
  }

  showPage(page: string) {
    this.pageChange.emit(page);
  }

  // Requests Data (من الباك اند عبر ServiceRequests)
  // =========================
  requests: RequestVm[] = [];

  // Requests Filter
  // =========================
  requestFilter = 'all';
  requestFilters = [
    { key: 'all', label: 'الكل' },
    { key: 'draft', label: 'مسودات' },
    { key: 'active', label: 'جارية' },
    { key: 'waiting', label: 'في انتظار العروض' },
    { key: 'done', label: 'مكتملة' },
    { key: 'cancelled', label: 'ملغاة' },
  ];

  get filteredRequests() {
    let result = this.requests;
    if (this.requestFilter !== 'all') {
      result = result.filter((request) => request.status === this.requestFilter);
    }
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (request) =>
          request.title.toLowerCase().includes(search) ||
          request.category.toLowerCase().includes(search) ||
          request.location.toLowerCase().includes(search) ||
          request.code.toLowerCase().includes(search),
      );
    }
    return result;
  }

  /////////Status منظم
  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';

      case 'waiting':
        return 'status-waiting';

      case 'done':
        return 'status-done';

      case 'cancelled':
        return 'status-cancelled';

      case 'draft':
        return 'status-default';

      default:
        return 'status-default';
    }
  }
  // Request Details
  // =========================
  selectedRequest: RequestVm | null = null;
  showDetails = false;
  // Open / Close Details
  // =========================
  detailsLoading = false;
  detailsError = '';

  openRequestDetails(request: RequestVm) {
    this.selectedRequest = request;
    this.showDetails = true;
    this.detailsLoading = true;
    this.detailsError = '';

    // نحمّل التفاصيل الكاملة: التايم لاين الحقيقي + الصور
    this.requestsApi.loadDetails(request.id).subscribe({
      next: (fresh) => {
        if (this.selectedRequest?.id === fresh.id) {
          this.selectedRequest = fresh;
        }
        this.detailsLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.detailsLoading = false;
        this.detailsError = error?.error?.message || 'تعذر تحميل تفاصيل الطلب.';
        this.cdr.markForCheck();
      },
    });
  }

  closeRequestDetails() {
    this.showDetails = false;
    this.selectedRequest = null;
  }

  get currentRequestDetails(): any {
    return this.selectedRequest;
  }

  // =========================
  // Confirm Modal
  // =========================

  confirmModalOpen = false;

  confirmAction = '';

  confirmTitle = '';

  confirmMessage = '';

  cancelReason = '';

  actionLoading = false;

  actionError = '';

  openConfirm(action: string, title: string, message: string) {
    this.confirmAction = action;

    this.confirmTitle = title;

    this.confirmMessage = message;

    this.cancelReason = '';

    this.actionError = '';

    this.confirmModalOpen = true;
  }

  closeConfirm() {
    this.confirmModalOpen = false;
    this.actionLoading = false;
  }

  confirmActionHandler() {
    if (!this.selectedRequest || this.actionLoading) {
      return;
    }

    const id = this.selectedRequest.id;
    let call$: Observable<RequestVm>;
    let successMessage = '';

    if (this.confirmAction === 'cancel') {
      const reason = this.cancelReason.trim();
      if (reason.length < 3) {
        this.actionError = 'من فضلك اكتب سبب إلغاء الطلب (3 حروف على الأقل).';
        return;
      }
      call$ = this.requestsApi.cancel(id, reason);
      successMessage = 'تم إلغاء الطلب بنجاح';
    } else if (this.confirmAction === 'republish') {
      call$ = this.requestsApi.republish(id);
      successMessage = 'تم إعادة نشر الطلب بنجاح';
    } else if (this.confirmAction === 'publish') {
      call$ = this.requestsApi.publish(id);
      successMessage = 'تم نشر الطلب بنجاح';
    } else {
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    call$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.confirmModalOpen = false;
        this.closeRequestDetails();
        this.toast.emit({ message: successMessage, type: 'success' });
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.actionLoading = false;
        this.actionError = error?.error?.message || 'حصلت مشكلة، حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }

  // =========================
  // Rating
  // =========================

  ratingModalOpen = false;

  selectedRatingRequest: any = null;

  selectedRating = 0;

  ratingComment = '';

  rated: { [key: string]: boolean } = {};

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

  submitRating() {
    if (!this.selectedRating || !this.selectedRatingRequest) {
      return;
    }

    const requestId = this.selectedRatingRequest.id;

    // POST /api/v1/requests/:id/review
    this.marketplace.submitReview(requestId, this.selectedRating, this.ratingComment).subscribe({
      next: () => {
        this.rated[requestId] = true;
        this.closeRating();
        this.showToast('تم إرسال تقييمك بنجاح');
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'تعذر إرسال التقييم');
      },
    });
  }

  // =========================
  // Schedule
  // =========================

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

  // =========================
  // Invoice
  // =========================

  invoiceModalOpen = false;

  openInvoice() {
    this.invoiceModalOpen = true;
  }

  closeInvoice() {
    this.invoiceModalOpen = false;
  }

  downloadInvoice() {
    const invoice = `
فاتورة أسطى
------------------------
رقم الطلب: ${this.selectedRequest?.code}
الخدمة: ${this.selectedRequest?.title}
الأسطى: ${this.currentRequestDetails?.craftsman?.name || 'غير محدد'}

قيمة العمل: ${this.selectedRequest?.budget} ج.م
رسوم المنصة: 0 ج.م
الإجمالي: ${this.selectedRequest?.budget} ج.م

تم دفع المبلغ من خلال ضمان المنصة.
`;
    const blob = new Blob([invoice], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${this.selectedRequest?.code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('تم تحميل الفاتورة بنجاح');
  }

  // =========================
  // Toast (بيتعرض من الداشبورد الأساسي)
  // =========================

  showToast(message: string) {
    this.toast.emit({ message, type: 'success' });
  }
}
