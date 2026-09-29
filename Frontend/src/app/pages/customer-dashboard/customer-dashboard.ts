import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class CustomerDashboard {
  constructor(private router: Router) {}
  user = {
    name: 'م. أحمد عثمان',
    email: 'ahmed@domain.com',
  };
  get userInitials() {
    return 'أ ع';
  }
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
    },
  ];
  requestDetails: any = {
    'REQ-2418': {
      description:
        'تجديد مطبخ أرو أمريكي بالكامل مع تغيير المفصلات والإكسسوارات وتنفيذ التشطيبات المطلوبة.',
      photos: [
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55',
      ],
      timeline: [
        { title: 'تم إنشاء الطلب', date: '24 مايو، 10:30 ص', done: true },
        { title: 'استقبال العروض', date: '24 مايو، 11:15 ص', done: true },
        { title: 'اختيار الأسطى', date: 'في انتظار الاختيار', done: false },
        { title: 'بدء التنفيذ', date: 'بعد قبول العرض', done: false },
        { title: 'اكتمال العمل', date: 'لم يبدأ بعد', done: false },
      ],
    },

    'REQ-2425': {
      description: 'تركيب تكييفين سبليت مع تجهيز أماكن التركيب والتأكد من التوصيلات والتشغيل.',
      photos: ['https://images.unsplash.com/photo-1631545806609-8b4c6d6d3f1f'],
      timeline: [
        { title: 'تم إنشاء الطلب', date: '24 مايو', done: true },
        { title: 'استقبال العروض', date: 'تم استقبال عرضين', done: true },
        { title: 'اختيار الأسطى', date: 'في انتظار الاختيار', done: false },
        { title: 'بدء التنفيذ', date: 'بعد قبول العرض', done: false },
        { title: 'اكتمال العمل', date: 'لم يبدأ بعد', done: false },
      ],
    },
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
        { title: 'تم إنشاء الطلب', date: '24 مايو', done: true },
        { title: 'تم اختيار الأسطى', date: '24 مايو', done: true },
        { title: 'جاري التنفيذ', date: 'العمل قيد التنفيذ', done: true },
        { title: 'اكتمال العمل', date: 'لم يكتمل بعد', done: false },
      ],
    },

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
        { title: 'تم إنشاء الطلب', date: '24 مايو', done: true },
        { title: 'تم اختيار الأسطى', date: '24 مايو', done: true },
        { title: 'المعاينة', date: 'في انتظار تحديد الموعد', done: false },
        { title: 'بدء التنفيذ', date: 'بعد المعاينة', done: false },
        { title: 'اكتمال العمل', date: 'لم يبدأ بعد', done: false },
      ],
    },
  };
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
  selectedCraft = '';
  crafts = ['سباك', 'كهربائي', 'نجار', 'نقاش', 'حداد', 'تكييف', 'سيراميك', 'أجهزة'];
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
  newRequestBudget: number | null = null;
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
  escrowAmount = 4850;
  walletBalance = 2300;

  get activeRequests() {
    return this.requests.filter((request) => request.status === 'active');
  }
  ///////////إنشاء طلب جديد
  reqSeq = 2426;
  resetNewRequest() {
    this.selectedCraft = '';
    this.newRequestTitle = '';
    this.newRequestDescription = '';
    this.newRequestLocation = '';
    this.newRequestBudget = null;
    this.newRequestWhen = 'بأسرع وقت ممكن';
    this.newRequestReceive = 'all';
    this.termsAccepted = false;
  }
  newRequestOpen = false;
  openNewRequest() {
    this.newRequestOpen = true;
  }

  submitNewRequest() {
    if (
      !this.selectedCraft ||
      !this.newRequestTitle ||
      !this.newRequestDescription ||
      !this.newRequestLocation ||
      !this.newRequestBudget ||
      !this.termsAccepted
    ) {
      return;
    }

    const newId = `REQ-${this.reqSeq++}`;
    this.requests.unshift({
      id: newId,
      title: this.newRequestTitle,
      category: this.selectedCraft,
      location: this.newRequestLocation,
      status: 'waiting',
      statusText: 'في انتظار العروض',
      budget: this.newRequestBudget,
      offers: 0,
    });
    this.closeNewRequest();
    this.requestFilter = 'all';
    this.activePage = 'requests';
    this.resetNewRequest();
    this.toastMessage = 'تم نشر طلبك بنجاح';
    this.toastOpen = true;
    setTimeout(() => {
      this.toastOpen = false;
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
  submitRating() {
    if (!this.selectedRating || !this.selectedRatingRequest) {
      return;
    }
    const requestId = this.selectedRatingRequest.id;
    // تسجيل إن الطلب اتقيّم
    this.rated[requestId] = true;
    this.closeRating();
    this.toastMessage = 'تم إرسال تقييمك بنجاح';
    this.toastOpen = true;
    setTimeout(() => {
      this.toastOpen = false;
    }, 3000);
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
    this.toastMessage = 'تم تحديد موعد المعاينة بنجاح';
    this.toastOpen = true;
    setTimeout(() => {
      this.toastOpen = false;
    }, 3000);
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
