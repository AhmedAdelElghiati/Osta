import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-craftsmen-guide',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './craftsmen-guide.html',
  styleUrl: './craftsmen-guide.css',
})
export class CraftsmenGuide implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private api: Marketplace,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.searchSpecialty = params['specialty'] || '';
      this.searchLocation = params['location'] || '';
      this.currentPage = 1;
      this.loadFromApi();
    });
  }

  ngOnInit(): void {
    this.loadFromApi();
  }

  // ===== API state — GET /api/v1/artisans =====
  apiLoading = false;
  apiError = '';
  apiCraftsmen: any[] = [];

  loadFromApi(): void {
    this.apiLoading = true;
    this.apiError = '';
    this.api
      .listArtisans({
        search: this.searchSpecialty,
        area: this.searchLocation,
        limit: 50,
      })
      .subscribe({
        next: (res: any) => {
          const items = res?.data?.items ?? [];
          this.apiCraftsmen = items.map((a: any) => ({
            id: a.id,
            name: a.name,
            title: a.profession,
            verified: a.isVerified,
            specialty: a.profession,
            rating: a.rating,
            reviewCount: a.totalReviews,
            responseTime: '—',
            location: (a.serviceAreas || []).join('، ') || a.location,
            distance: '',
            distanceValue: 0,
            priceFrom: a.hourlyRate,
            experience: `${a.experienceYears || 0} سنوات`,
            guarantee: null,
            photosCount: 0,
            tags: a.skills || [],
            photos: [],
            avatar: a.avatar || 'craftsman-hassan.jpg',
            available: true,
            credentials: [],
            bio: a.bio,
          }));
          this.apiLoading = false;
          this.currentPage = 1;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.apiLoading = false;
          this.apiError = err?.error?.message || 'تعذر تحميل الأسطوات، معروض بيانات تجريبية.';
          this.cdr.markForCheck();
        },
      });
  }

  searchSpecialty = '';
  searchLocation = '';

  selectedSpecialty = '';
  selectedLocation = '';

  sortBy = 'الأفضل تقييماً';

  distanceRange = 12;
  priceMin = 100;
  priceMax = 400;

  currentPage = 1;
  itemsPerPage = 4;

  showFilters = true;

  credentialsFilters = {
    securityChecked: false,
    skillCertificate: false,
    experience7Years: false,
    invoiceGuarantee: false,
  };

  specialties = [
    { name: 'سباكة وصرف صحي', count: 48, selected: false },
    { name: 'كهرباء وتأسيس وتوصيلات', count: 62, selected: false },
    { name: 'تكييف، تبريد وتدفئة', count: 31, selected: false },
    { name: 'نجارة وأبواب ومطابخ ودواليب', count: 27, selected: false },
    { name: 'نقاشة ودهانات ديكورية', count: 19, selected: false },
    { name: 'ألوميتال وزجاج', count: 14, selected: false },
  ];

  craftsmen = [
    // =========================
    // 1
    // =========================
    {
      id: 1,
      name: 'أسطى إبراهيم صقر',
      title: 'مهندس سباكة محترف ومدرب',
      verified: true,
      specialty: 'مهندس سباكة وفحص شبكات المياه وتأسيس السباكة',
      rating: 4.95,
      reviewCount: 142,
      responseTime: '8 دقائق',
      location: 'التجمع الخامس',
      distance: '2.4 كم',
      distanceValue: 2.4,
      priceFrom: 150,
      experience: '14 سنة',
      guarantee: 'شهرين على التركيب',
      photosCount: 18,
      tags: ['نقابة التطبيقيين'],
      photos: ['plumbing-work.jpg', 'craftsman-work1.jpg', 'electrical-work.jpg'],
      avatar: 'craftsman-hassan.jpg',
      available: true,
      credentials: ['فيش وتشبيه مفحوص أمنياً', 'شهادة قياس مهارة وخبرة'],
    },

    // =========================
    // 2
    // =========================
    {
      id: 2,
      name: 'م. طارق عبد الرحمن',
      title: 'فني أنظمة كهرباء ذكية',
      verified: true,
      specialty: 'تأسيس وتركيب لوحات الكهرباء والكاميرات والأنظمة الذكية',
      rating: 4.88,
      reviewCount: 98,
      responseTime: '15 دقيقة',
      location: 'الرحاب والمستقبل',
      distance: '4.1 كم',
      distanceValue: 4.1,
      priceFrom: 200,
      experience: '9 سنوات',
      guarantee: null,
      photosCount: 12,
      tags: ['يقبل كاش وفيزا ومحافظ إلكترونية', 'نقابة التطبيقيين'],
      photos: ['electrical-work.jpg', 'craftsman-work1.jpg', 'carpenter-work.jpg'],
      avatar: 'craftsman-tarek.jpg',
      available: true,
      credentials: ['فيش وتشبيه مفحوص أمنياً', 'شهادة قياس مهارة وخبرة'],
    },

    // =========================
    // 3
    // =========================
    {
      id: 3,
      name: 'أسطى عادل الشريبيني',
      title: 'وكيل صيانة تكييفات معتمد',
      verified: true,
      specialty: 'فحص وتنظيف وصيانة أجهزة التكييف وتركيب قطع الغيار',
      rating: 4.91,
      reviewCount: 74,
      responseTime: '5 دقائق',
      location: 'النرجس والتجمع',
      distance: '1.8 كم',
      distanceValue: 1.8,
      priceFrom: 120,
      experience: '10 سنوات',
      guarantee: 'ضمان 90 يوم',
      photosCount: 9,
      tags: ['قطع غيار أصلية'],
      photos: ['plumbing-work.jpg', 'electrical-work.jpg', 'craftsman-work1.jpg'],
      avatar: 'craftsman-adel.jpg',
      available: true,
      credentials: [],
    },

    // =========================
    // 4
    // =========================
    {
      id: 4,
      name: 'أسطى محمود النجار',
      title: 'معلم نجارة وديكورات خشبية',
      verified: true,
      specialty: 'تصليح وتجديد الأبواب والأثاث والديكورات الخشبية',
      rating: 4.82,
      reviewCount: 63,
      responseTime: '25 دقيقة',
      location: 'التجمع الأول',
      distance: '5.8 كم',
      distanceValue: 5.8,
      priceFrom: 100,
      experience: '12 سنة',
      guarantee: null,
      photosCount: 22,
      tags: ['أخشاب طبيعية', 'ورشة مجهزة'],
      photos: ['carpenter-work.jpg', 'craftsman-work1.jpg', 'plumbing-work.jpg'],
      avatar: 'craftsman-mahmoud.jpg',
      available: true,
      credentials: [],
    },

    // =========================
    // 5
    // =========================
    {
      id: 5,
      name: 'أسطى حسن عبد الله',
      title: 'معلم نقاشة ودهانات ديكورية',
      verified: true,
      specialty: 'نقاشة ودهانات داخلية وخارجية وديكورات حوائط',
      rating: 4.86,
      reviewCount: 87,
      responseTime: '12 دقيقة',
      location: 'مدينة نصر',
      distance: '7.2 كم',
      distanceValue: 7.2,
      priceFrom: 180,
      experience: '11 سنة',
      guarantee: 'ضمان شهر',
      photosCount: 16,
      tags: ['دهانات ديكورية', 'تشطيب احترافي'],
      photos: ['plumbing-work.jpg', 'craftsman-work1.jpg'],
      avatar: 'craftsman-Ali.jpg',
      available: true,
      credentials: ['شهادة قياس مهارة وخبرة'],
    },

    // =========================
    // 6
    // =========================
    {
      id: 6,
      name: 'أسطى محمود أحمد',
      title: 'فني ألوميتال وزجاج',
      verified: true,
      specialty: 'تركيب وصيانة الألوميتال والشبابيك والأبواب الزجاجية',
      rating: 4.79,
      reviewCount: 56,
      responseTime: '20 دقيقة',
      location: 'مصر الجديدة',
      distance: '8.5 كم',
      distanceValue: 8.5,
      priceFrom: 250,
      experience: '8 سنوات',
      guarantee: 'ضمان 3 شهور',
      photosCount: 14,
      tags: ['قياسات دقيقة', 'خامات عالية الجودة'],
      photos: ['carpenter-work.jpg', 'electrical-work.jpg'],
      avatar: 'craftsman-Ashref.jpg',
      available: true,
      credentials: ['فيش وتشبيه مفحوص أمنياً'],
    },

    // =========================
    // 7
    // =========================
    {
      id: 7,
      name: 'أسطى أحمد السيد',
      title: 'فني سباكة وصيانة منزلية',
      verified: true,
      specialty: 'سباكة منزلية وإصلاح تسريب المياه وتركيب الأدوات الصحية',
      rating: 4.84,
      reviewCount: 69,
      responseTime: '10 دقائق',
      location: 'المعادي',
      distance: '9.1 كم',
      distanceValue: 9.1,
      priceFrom: 130,
      experience: '9 سنوات',
      guarantee: 'ضمان شهرين',
      photosCount: 11,
      tags: ['خدمة منزلية', 'متاح طوال الأسبوع'],
      photos: ['plumbing-work.jpg', 'craftsman-work1.jpg'],
      avatar: 'craftsman-ahmed.jpg',
      available: true,
      credentials: ['شهادة قياس مهارة وخبرة'],
    },

    // =========================
    // 8
    // =========================
    {
      id: 8,
      name: 'أسطى كريم فتحي',
      title: 'فني كهرباء وصيانة منزلية',
      verified: true,
      specialty: 'كهرباء منزلية وتأسيس وصيانة الأعطال وتركيب الإضاءة',
      rating: 4.77,
      reviewCount: 51,
      responseTime: '18 دقيقة',
      location: 'مدينة الشروق',
      distance: '6.7 كم',
      distanceValue: 6.7,
      priceFrom: 160,
      experience: '7 سنوات',
      guarantee: null,
      photosCount: 10,
      tags: ['صيانة منزلية', 'تركيب إضاءة'],
      photos: ['electrical-work.jpg', 'craftsman-work1.jpg'],
      avatar: 'craftsman-karim.jpg',
      available: true,
      credentials: [],
    },
  ];

  // =========================
  // FILTER + SEARCH + SORT
  // =========================

  get filteredCraftsmen() {
    // لو الـ API رجّع أسطوات حقيقيين استخدمهم، غير كده البيانات التجريبية
    let result: any[] = this.apiCraftsmen.length ? [...this.apiCraftsmen] : [...this.craftsmen];

    // Specialty filter
    if (this.selectedSpecialty) {
      const specialtyWords = this.selectedSpecialty
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word: string) => word.length > 2);

      result = result.filter((c: any) =>
        specialtyWords.some(
          (word: string) =>
            c.specialty.toLowerCase().includes(word) || c.title.toLowerCase().includes(word),
        ),
      );
    }

    // Location filter
    if (this.selectedLocation) {
      const locationWords = this.selectedLocation
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word: string) => word.length > 2);

      result = result.filter((c: any) =>
        locationWords.some((word: string) => c.location.toLowerCase().includes(word)),
      );
    }

    // Distance
    result = result.filter((c: any) => c.distanceValue <= this.distanceRange);

    // Price
    result = result.filter(
      (c: any) => (c.priceFrom ?? 0) >= this.priceMin && (c.priceFrom ?? 0) <= this.priceMax,
    );

    // Security check
    if (this.credentialsFilters.securityChecked) {
      result = result.filter((c: any) => c.credentials.includes('فيش وتشبيه مفحوص أمنياً'));
    }

    // Skill certificate
    if (this.credentialsFilters.skillCertificate) {
      result = result.filter((c: any) => c.credentials.includes('شهادة قياس مهارة وخبرة'));
    }

    // Experience
    if (this.credentialsFilters.experience7Years) {
      result = result.filter((c: any) => this.getExperienceYears(c.experience) >= 7);
    }

    // Guarantee
    if (this.credentialsFilters.invoiceGuarantee) {
      result = result.filter((c: any) => !!c.guarantee);
    }

    // Search specialty
    if (this.searchSpecialty.trim()) {
      const searchWords = this.searchSpecialty
        .trim()
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word: string) => word.length > 1);

      result = result.filter((c: any) =>
        searchWords.some(
          (word: string) =>
            c.name.toLowerCase().includes(word) ||
            c.title.toLowerCase().includes(word) ||
            c.specialty.toLowerCase().includes(word) ||
            c.tags.some((tag: string) => tag.toLowerCase().includes(word)),
        ),
      );
    }

    // Search location
    if (this.searchLocation.trim()) {
      const locationWords = this.searchLocation
        .trim()
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word: string) => word.length > 1);

      result = result.filter((c: any) =>
        locationWords.some((word: string) => c.location.toLowerCase().includes(word)),
      );
    }

    // Sorting
    switch (this.sortBy) {
      case 'الأفضل تقييماً':
        result.sort((a: any, b: any) => b.rating - a.rating);

        break;

      case 'الأقرب إليك':
        result.sort((a: any, b: any) => a.distanceValue - b.distanceValue);

        break;

      case 'الأسرع رداً':
        result.sort(
          (a: any, b: any) =>
            this.getResponseMinutes(a.responseTime) - this.getResponseMinutes(b.responseTime),
        );

        break;

      case 'الأقل سعراً':
        result.sort((a: any, b: any) => (a.priceFrom ?? 999999) - (b.priceFrom ?? 999999));

        break;
    }

    return result;
  }

  // =========================
  // PAGINATION
  // =========================

  get displayedCraftsmen() {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    const end = start + this.itemsPerPage;

    return this.filteredCraftsmen.slice(start, end);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCraftsmen.length / this.itemsPerPage));
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];

    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }

    return pages;
  }

  get firstDisplayedItem(): number {
    if (this.filteredCraftsmen.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get lastDisplayedItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCraftsmen.length);
  }

  // =========================
  // SPECIALTY
  // =========================

  selectSpecialty(specialty: any): void {
    this.specialties.forEach((s) => (s.selected = false));

    specialty.selected = true;

    this.selectedSpecialty = specialty.name;

    this.currentPage = 1;
  }

  clearSpecialty(): void {
    this.specialties.forEach((s) => (s.selected = false));

    this.selectedSpecialty = '';

    this.currentPage = 1;
  }

  // =========================
  // SEARCH / FILTER / SORT
  // =========================

  search(): void {
    this.currentPage = 1;
    this.loadFromApi();
  }

  applyFilters(): void {
    this.currentPage = 1;
  }

  changeSort(): void {
    this.currentPage = 1;
  }

  // =========================
  // PAGINATION ACTIONS
  // =========================

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // =========================
  // FILTER TOGGLE
  // =========================

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // =========================
  // HELPERS
  // =========================

  getExperienceYears(experience: string | null): number {
    if (!experience) {
      return 0;
    }

    const match = experience.match(/\d+/);

    return match ? Number(match[0]) : 0;
  }

  getResponseMinutes(responseTime: string): number {
    if (responseTime.includes('ساعة')) {
      const hours = Number(responseTime.match(/\d+/)?.[0] ?? 1);

      return hours * 60;
    }

    if (responseTime.includes('ربع')) {
      return 15;
    }

    return Number(responseTime.match(/\d+/)?.[0] ?? 999);
  }
}
