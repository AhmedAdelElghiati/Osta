import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { Marketplace } from '../../../../services/marketplace';

@Component({
  selector: 'app-dashboard-offers',
  imports: [CommonModule],
  templateUrl: './dashboard-offers.html',
  styleUrl: './dashboard-offers.css',
})
export class DashboardOffers implements OnInit {
  @Output() pageChange = new EventEmitter<string>();
  @Output() newRequest = new EventEmitter<void>();
  @Output() requestDetails = new EventEmitter<string>();
  @Output() offerAccepted = new EventEmitter<string>();

  constructor(private api: Marketplace, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  // ===== Real offers — GET /api/v1/offers/mine =====
  offersLoading = false;
  offersError = '';
  realOffers: any[] = [];

  loadOffers(): void {
    this.offersLoading = true;
    this.offersError = '';
    this.api.myOffers().subscribe({
      next: (res: any) => {
        this.realOffers = res?.data ?? [];
        this.offersLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.offersLoading = false;
        this.offersError = err?.error?.message || 'تعذر تحميل العروض.';
        this.cdr.markForCheck();
      },
    });
  }

  acceptReal(offer: any): void {
    this.api.acceptOffer(offer._id).subscribe({
      next: () => {
        this.showToast('تم قبول العرض بنجاح');
        this.loadOffers();
        this.offerAccepted.emit(offer.requestId?._id || offer.requestId);
      },
      error: (err) => this.showToast(err?.error?.message || 'تعذر قبول العرض'),
    });
  }

  rejectReal(offer: any): void {
    this.api.rejectOffer(offer._id).subscribe({
      next: () => {
        this.showToast('تم رفض العرض');
        this.loadOffers();
      },
      error: (err) => this.showToast(err?.error?.message || 'تعذر رفض العرض'),
    });
  }
  // Selected Offer Group
  offerGroup = 'g-kitchen';
  // Offer Groups
  offerGroups = [
    {
      id: 'g-kitchen',
      requestId: 'REQ-2418',
      title: 'تجديد مطبخ أرو أمريكي',
      location: 'مدينة نصر',
      budget: 12000,
      status: '3 عروض',
      offersCount: 3,
      photosCount: 4,
      remaining: 'متبقي 3 أيام',
    },

    {
      id: 'g-ac',
      requestId: 'REQ-2425',
      title: 'تركيب تكييفين سبليت',
      location: 'مدينة نصر',
      budget: 20000,
      status: '2 عروض',
      offersCount: 2,
      photosCount: 2,
      remaining: 'متبقي يومين',
    },

    {
      id: 'g-bath',
      requestId: 'REQ-2411',
      title: 'صيانة سباكة ومحابس الحمام',
      location: 'مدينة نصر',
      budget: 1400,
      status: 'مقبول',
      offersCount: 1,
      photosCount: 0,
      remaining: '',
    },
  ];
  // Kitchen Offers
  kitchenOffers = [
    {
      name: 'الأسطى محمود الشريف',
      subtitle: 'كبير نجارين معتمد',
      rating: 4.9,
      price: 10500,
      duration: '8 أيام',
      warranty: 'سنة',
      disassembly: 'متوفر',
      icon: 'bi-person',
      quoteItems: [
        {
          name: 'فك وتركيب المطبخ',
          price: 2500,
        },
        {
          name: 'أعمال النجارة والتجديد',
          price: 5200,
        },
        {
          name: 'المفصلات والإكسسوارات',
          price: 1900,
        },
        {
          name: 'التسليم والتركيب النهائي',
          price: 900,
        },
      ],
    },

    {
      name: 'ورشة الأمانة للديكور',
      subtitle: 'موبيليا وديكور معتمد',
      rating: 4.7,
      price: 9800,
      duration: '10 أيام',
      warranty: 'سنة',
      disassembly: 'متوفر',
      icon: 'bi-person',
      quoteItems: [
        {
          name: 'فك وتركيب المطبخ',
          price: 2300,
        },
        {
          name: 'أعمال النجارة والتجديد',
          price: 5100,
        },
        {
          name: 'المفصلات والإكسسوارات',
          price: 1500,
        },
        {
          name: 'التسليم والتركيب النهائي',
          price: 900,
        },
      ],
    },

    {
      name: 'الحديث للديكور',
      subtitle: 'نجارة وموبيليا معتمدة',
      rating: 4.8,
      price: 11200,
      duration: '7 أيام',
      warranty: 'سنتين',
      disassembly: 'متوفر',
      icon: 'bi-person',
      quoteItems: [
        {
          name: 'فك وتركيب المطبخ',
          price: 2600,
        },
        {
          name: 'أعمال النجارة والتجديد',
          price: 5600,
        },
        {
          name: 'المفصلات والإكسسوارات',
          price: 2000,
        },
        {
          name: 'التسليم والتركيب النهائي',
          price: 1000,
        },
      ],
    },
  ];
  // AC Offers
  acOffers = [
    {
      name: 'شركة برنس للتكييف',
      subtitle: 'شركة تكييف وتبريد معتمدة',
      rating: 4.8,
      price: 17900,
      duration: 'يوم واحد',
      warranty: 'سنة',
      installation: 'يشمل التركيب والتشغيل',
      icon: 'bi-snow2',
      quoteItems: [
        {
          name: 'تركيب التكييف الأول',
          price: 8500,
        },
        {
          name: 'تركيب التكييف الثاني',
          price: 8500,
        },
        {
          name: 'اختبار وتشغيل',
          price: 900,
        },
      ],
    },

    {
      name: 'الأسطى سيد التكييفات',
      subtitle: 'فني تكييف وتبريد معتمد',
      rating: 4.6,
      price: 18600,
      duration: 'يومين',
      warranty: 'سنة',
      installation: 'يشمل التركيب والتشغيل',
      icon: 'bi-snow2',
      quoteItems: [
        {
          name: 'تركيب التكييف الأول',
          price: 8800,
        },
        {
          name: 'تركيب التكييف الثاني',
          price: 8800,
        },
        {
          name: 'اختبار وتشغيل',
          price: 1000,
        },
      ],
    },
  ];
  // Accepted Request
  acceptedRequest = {
    id: 'REQ-2411',
    title: 'صيانة سباكة ومحابس الحمام',
    location: 'مدينة نصر',
    price: 1400,
    craftsman: {
      name: 'الأسطى إبراهيم صقر',
      category: 'سباك معتمد',
      rating: 4.8,
      jobs: 214,
    },
    escrowMessage: 'تم حجز مبلغ 1,400 ج.م وسيتم تحويله للصنايعي بعد تأكيدك إتمام العمل.',
  };
  // Quote Modal
  quoteModalOpen = false;
  selectedQuote: any = null;
  openQuote(offer: any) {
    this.selectedQuote = offer;
    this.quoteModalOpen = true;
  }

  closeQuote() {
    this.quoteModalOpen = false;
    this.selectedQuote = null;
  }

  get quoteTotal() {
    if (!this.selectedQuote) {
      return 0;
    }

    return this.selectedQuote.quoteItems.reduce(
      (total: number, item: any) => total + item.price,
      0,
    );
  }

  // Accept Offer Modal

  acceptModalOpen = false;

  selectedOffer: any = null;

  openAccept(offer: any) {
    this.selectedOffer = offer;
    this.acceptModalOpen = true;
  }

  closeAccept() {
    this.acceptModalOpen = false;
    this.selectedOffer = null;
  }
  acceptedOffer: any = null;
  acceptedAcOffer: any = null;
  confirmAccept() {
    if (!this.selectedOffer) {
      return;
    }

    const offer = this.selectedOffer;

    if (this.offerGroup === 'g-kitchen') {
      this.acceptedOffer = offer;

      const kitchenGroup = this.offerGroups.find((group) => group.id === 'g-kitchen');

      if (kitchenGroup) {
        kitchenGroup.status = 'مقبول';
        kitchenGroup.offersCount = 1;
        kitchenGroup.remaining = '';
      }
    }

    if (this.offerGroup === 'g-ac') {
      this.acceptedAcOffer = offer;

      const acGroup = this.offerGroups.find((group) => group.id === 'g-ac');

      if (acGroup) {
        acGroup.status = 'مقبول';
        acGroup.offersCount = 1;
        acGroup.remaining = '';
      }
    }
    this.acceptModalOpen = false;
    this.selectedOffer = null;
    this.offerAccepted.emit(this.offerGroup);
    this.showToast(`تم قبول عرض ${offer.name} بنجاح`);
  }
  acceptSelectedQuote() {
    if (!this.selectedQuote) {
      return;
    }
    const offer = this.selectedQuote;
    this.closeQuote();
    this.openAccept(offer);
  }
  // Toast
  toastVisible = false;
  toastMessage = '';
  private toastTimer: any;
  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    clearTimeout(this.toastTimer);

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  closeToast() {
    this.toastVisible = false;
  }

  // Navigation

  openNewRequest() {
    this.newRequest.emit();
  }

  openRequestDetails(groupId: string) {
    const group = this.offerGroups.find((item) => item.id === groupId);

    if (group) {
      this.requestDetails.emit(group.requestId);
    }
  }

  goToPage(page: string) {
    this.pageChange.emit(page);
  }

  // Craftsman Chat

  chatWithCraftsman() {
    this.pageChange.emit('support');
  }
}
