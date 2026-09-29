import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-requests.html',
  styleUrl: './dashboard-requests.css',
})
export class DashboardRequests implements OnChanges {
  @Input() selectedRequestId = '';
  @Input() searchTerm = '';
  // Navigation
  // =========================
  @Output() pageChange = new EventEmitter<string>();
  ngOnChanges() {
    if (!this.selectedRequestId) {
      return;
    }
    const request = this.requests.find((item) => item.id === this.selectedRequestId);
    if (request) {
      this.selectedRequest = request;
      this.showDetails = true;
    }
  }

  openNewRequest() {
    this.pageChange.emit('new-request');
  }

  showPage(page: string) {
    this.pageChange.emit(page);
  }

  // Requests Data
  // =========================
  requests = [
    {
      id: 'REQ-2418',
      title: 'تجديد مطبخ أرو أمريكي',
      category: 'نجارة ومطابخ',
      location: 'مدينة نصر',
      status: 'waiting',
      statusText: 'في انتظار العروض',
      budget: 12000,
      offers: 3,
      icon: 'bi-hammer',

      description:
        'تجديد مطبخ أرو أمريكي بالكامل مع تغيير المفصلات والإكسسوارات وتنفيذ التشطيبات المطلوبة.',

      photos: [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55',
      ],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو، 10:30 ص',
          done: true,
        },
        {
          title: 'استقبال العروض',
          date: '24 مايو، 11:15 ص',
          done: true,
        },
        {
          title: 'اختيار الأسطى',
          date: 'في انتظار الاختيار',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد قبول العرض',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],

      craftsman: null,
    },

    {
      id: 'REQ-2425',
      title: 'تركيب تكييفين سبليت',
      category: 'تكييف وتبريد',
      location: 'مدينة نصر',
      status: 'waiting',
      statusText: 'في انتظار العروض',
      budget: 20000,
      offers: 2,
      icon: 'bi-snow',

      description: 'تركيب تكييفين سبليت مع تجهيز أماكن التركيب والتأكد من التوصيلات والتشغيل.',

      photos: ['https://images.unsplash.com/photo-1631545806609-8b4c6d6d3f1f1'],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'استقبال العروض',
          date: 'تم استقبال عرضين',
          done: true,
        },
        {
          title: 'اختيار الأسطى',
          date: 'في انتظار الاختيار',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد قبول العرض',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],

      craftsman: null,
    },

    {
      id: 'REQ-2411',
      title: 'صيانة سباكة ومحابس الحمام',
      category: 'سباكة',
      location: 'مدينة نصر',
      status: 'active',
      statusText: 'جارية',
      budget: 1400,
      offers: 1,
      icon: 'bi-droplet',

      description: 'صيانة سباكة ومحابس الحمام وإصلاح التسريبات الموجودة.',

      photos: [],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'جاري التنفيذ',
          date: 'العمل قيد التنفيذ',
          done: true,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يكتمل بعد',
          done: false,
        },
      ],

      craftsman: {
        name: 'إبراهيم صقر',
        category: 'سباك معتمد',
        rating: 4.8,
        jobs: 214,
        price: 1400,
      },
    },

    {
      id: 'REQ-2421',
      title: 'تأسيس إضاءة سمارت هوم',
      category: 'كهرباء',
      location: 'التجمع الخامس',
      status: 'active',
      statusText: 'جارية',
      budget: 3800,
      offers: 1,
      icon: 'bi-lightbulb',

      description: 'تأسيس إضاءة سمارت هوم وتجهيز التوصيلات اللازمة.',

      photos: [],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'المعاينة',
          date: 'في انتظار تحديد الموعد',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد المعاينة',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],

      craftsman: {
        name: 'طارق عبد الرحمن',
        category: 'كهربائي معتمد',
        rating: 4.9,
        jobs: 156,
        price: 3800,
      },
    },

    {
      id: 'REQ-2390',
      title: 'منقولة جبس بورد للصالة',
      category: 'جبس بورد',
      location: 'مدينة نصر',
      status: 'done',
      statusText: 'مكتملة',
      budget: 3200,
      offers: 1,
      icon: 'bi-house',
      description: 'تنفيذ منقولة جبس بورد للصالة مع التشطيبات النهائية المطلوبة.',
      photos: [],
      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '20 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '21 مايو',
          done: true,
        },
        {
          title: 'بدء التنفيذ',
          date: '22 مايو',
          done: true,
        },
        {
          title: 'اكتمال العمل',
          date: '23 مايو',
          done: true,
        },
      ],

      craftsman: {
        name: 'سيد عبد اللطيف',
        category: 'جبس بورد معتمد',
        rating: 4.7,
        jobs: 185,
        price: 3200,
      },
    },

    {
      id: 'REQ-2384',
      title: 'صيانة غسالة أوتوماتيك',
      category: 'أجهزة',
      location: 'مدينة نصر',
      status: 'cancelled',
      statusText: 'ملغاة',
      budget: 800,
      offers: 0,
      icon: 'bi-tools',

      description: 'صيانة غسالة أوتوماتيك ومعالجة العطل الموجود بها.',

      photos: [],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '18 مايو',
          done: true,
        },
        {
          title: 'إلغاء الطلب',
          date: '18 مايو',
          done: true,
        },
        {
          title: 'استرداد المبلغ',
          date: '19 مايو',
          done: true,
        },
      ],
      craftsman: null,
    },
  ];
  // Requests Filter
  // =========================
  requestFilter = 'all';
  requestFilters = [
    { key: 'all', label: 'الكل' },
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
          request.id.toLowerCase().includes(search),
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

      default:
        return 'status-default';
    }
  }
  // Request Details
  // =========================
  selectedRequest: any = null;
  showDetails = false;
  requestDetails: any = {
    // -------------------------
    // REQ-2418
    // -------------------------

    'REQ-2418': {
      description:
        'تجديد مطبخ أرو أمريكي بالكامل مع تغيير المفصلات والإكسسوارات وتنفيذ التشطيبات المطلوبة.',

      photos: [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55',
      ],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو، 10:30 ص',
          done: true,
        },
        {
          title: 'استقبال العروض',
          date: '24 مايو، 11:15 ص',
          done: true,
        },
        {
          title: 'اختيار الأسطى',
          date: 'في انتظار الاختيار',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد قبول العرض',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],
    },

    // -------------------------
    // REQ-2425
    // -------------------------

    'REQ-2425': {
      description: 'تركيب تكييفين سبليت مع تجهيز أماكن التركيب والتأكد من التوصيلات والتشغيل.',

      photos: ['https://images.unsplash.com/photo-1631545806609-8b4c6d6d3f1f'],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'استقبال العروض',
          date: 'تم استقبال عرضين',
          done: true,
        },
        {
          title: 'اختيار الأسطى',
          date: 'في انتظار الاختيار',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد قبول العرض',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],
    },

    // -------------------------
    // REQ-2411
    // -------------------------

    'REQ-2411': {
      description: 'صيانة سباكة ومحابس الحمام وإصلاح التسريبات الموجودة.',

      photos: [],

      craftsman: {
        name: 'إبراهيم صقر',
        category: 'سباك معتمد',
        rating: 4.8,
        jobs: 214,
        price: 1400,
      },

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'جاري التنفيذ',
          date: 'العمل قيد التنفيذ',
          done: true,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يكتمل بعد',
          done: false,
        },
      ],
    },

    // -------------------------
    // REQ-2421
    // -------------------------

    'REQ-2421': {
      description: 'تأسيس إضاءة سمارت هوم وتجهيز التوصيلات اللازمة.',

      photos: [],

      craftsman: {
        name: 'طارق عبد الرحمن',
        category: 'كهربائي معتمد',
        rating: 4.9,
        jobs: 156,
        price: 3800,
      },

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '24 مايو',
          done: true,
        },
        {
          title: 'المعاينة',
          date: 'في انتظار تحديد الموعد',
          done: false,
        },
        {
          title: 'بدء التنفيذ',
          date: 'بعد المعاينة',
          done: false,
        },
        {
          title: 'اكتمال العمل',
          date: 'لم يبدأ بعد',
          done: false,
        },
      ],
    },

    // -------------------------
    // REQ-2390
    // -------------------------

    'REQ-2390': {
      description: 'تنفيذ منقولة جبس بورد للصالة مع التشطيبات النهائية المطلوبة.',

      photos: [],

      craftsman: {
        name: 'سيد عبد اللطيف',
        category: 'جبس بورد معتمد',
        rating: 4.7,
        jobs: 185,
        price: 3200,
      },

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '20 مايو',
          done: true,
        },
        {
          title: 'تم اختيار الأسطى',
          date: '21 مايو',
          done: true,
        },
        {
          title: 'بدء التنفيذ',
          date: '22 مايو',
          done: true,
        },
        {
          title: 'اكتمال العمل',
          date: '23 مايو',
          done: true,
        },
      ],
    },

    // -------------------------
    // REQ-2384
    // -------------------------

    'REQ-2384': {
      description: 'صيانة غسالة أوتوماتيك ومعالجة العطل الموجود بها.',

      photos: [],

      timeline: [
        {
          title: 'تم إنشاء الطلب',
          date: '18 مايو',
          done: true,
        },
        {
          title: 'إلغاء الطلب',
          date: '18 مايو',
          done: true,
        },
        {
          title: 'استرداد المبلغ',
          date: '19 مايو',
          done: true,
        },
      ],
    },
  };
  // Open / Close Details
  // =========================
  openRequestDetails(request: any) {
    console.log('Selected request:', request);
    this.selectedRequest = request;
    this.showDetails = true;
  }

  closeRequestDetails() {
    this.showDetails = false;
    this.selectedRequest = null;
  }

  get currentRequestDetails() {
    return this.selectedRequest;
  }

  // =========================
  // Confirm Modal
  // =========================

  confirmModalOpen = false;

  confirmAction = '';

  confirmTitle = '';

  confirmMessage = '';

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

    // Cancel request

    if (this.confirmAction === 'cancel') {
      this.selectedRequest.status = 'cancelled';

      this.selectedRequest.statusText = 'ملغاة';

      this.closeConfirm();

      this.closeRequestDetails();

      this.showToast('تم إلغاء الطلب بنجاح');

      return;
    }

    // Republish request

    if (this.confirmAction === 'republish') {
      this.selectedRequest.status = 'waiting';

      this.selectedRequest.statusText = 'في انتظار العروض';

      this.selectedRequest.offers = 0;

      this.closeConfirm();

      this.closeRequestDetails();

      this.showToast('تم إعادة نشر الطلب بنجاح');

      return;
    }
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

    this.rated[requestId] = true;

    this.closeRating();

    this.showToast('تم إرسال تقييمك بنجاح');
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
رقم الطلب: ${this.selectedRequest?.id}
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
    link.download = `invoice-${this.selectedRequest?.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('تم تحميل الفاتورة بنجاح');
  }

  // =========================
  // Toast
  // =========================

  toastOpen = false;

  toastMessage = '';

  showToast(message: string) {
    this.toastMessage = message;

    this.toastOpen = true;

    setTimeout(() => {
      this.toastOpen = false;
    }, 3000);
  }
}
