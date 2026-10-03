import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';
import { API_ORIGIN } from '../../core/api.config';

interface GuideCraftsman {
  id: string;
  slug: string;
  name: string;
  title: string;
  verified: boolean;
  specialty: string;
  rating: number;
  reviewCount: number;
  responseTime: string;
  location: string;
  distance: string;
  distanceValue: number | null;
  priceFrom: number;
  experience: string | null;
  guarantee: string | null;
  photosCount: number;
  tags: string[];
  photos: string[];
  avatar: string;
  available: boolean;
  credentials: string[];
}

// تخصصات الفلتر (slug بيتطابق مع قيم التسجيل في الباك)
const SPECIALTY_DEFS = [
  { slug: 'plumbing', name: 'سباكة وصرف صحي', keywords: ['سباك'] },
  { slug: 'electricity', name: 'كهرباء وتأسيس وتوصيلات', keywords: ['كهرب'] },
  { slug: 'air-conditioning', name: 'تكييف، تبريد وتدفئة', keywords: ['تكييف', 'تبريد'] },
  { slug: 'carpentry', name: 'نجارة وأبواب ومطابخ ودواليب', keywords: ['نجار'] },
  { slug: 'painting', name: 'نقاشة ودهانات ديكورية', keywords: ['نقاش', 'دهان'] },
  { slug: 'aluminum', name: 'ألوميتال وزجاج', keywords: ['ألوميتال', 'الوميتال', 'زجاج'] },
];

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
    private router: Router,
    private marketplace: Marketplace,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.searchSpecialty = params['specialty'] || '';
      this.searchLocation = params['location'] || '';
      this.currentPage = 1;
      this.pendingArtisanId = params['artisan'] || '';
    });
  }

  private pendingArtisanId = '';

  searchSpecialty = '';
  searchLocation = '';

  selectedSpecialty = '';
  selectedLocation = '';

  sortBy = 'الأفضل تقييماً';

  distanceRange = 50;
  priceMin = 0;
  priceMax = 5000;

  currentPage = 1;
  itemsPerPage = 4;

  showFilters = true;

  loading = true;
  loadError = '';

  // بروفايل الأسطى (مودال)
  profileOpen = false;
  profileLoading = false;
  profileError = '';
  profile: any = null;

  credentialsFilters = {
    securityChecked: false,
    skillCertificate: false,
    experience7Years: false,
    invoiceGuarantee: false,
  };

  specialties = SPECIALTY_DEFS.map((d) => ({ ...d, count: 0, selected: false }));

  craftsmen: GuideCraftsman[] = [];

  // =========================
  // LOAD FROM BACKEND
  // =========================

  ngOnInit(): void {
    this.loadCraftsmen();
  }

  loadCraftsmen(): void {
    this.loading = true;
    this.loadError = '';
    const all: any[] = [];

    const fetchPage = (page: number) => {
      this.marketplace.listArtisans({ limit: 50, page }).subscribe({
        next: (response) => {
          const items = response?.data?.items ?? [];
          all.push(...items);
          const totalPages = response?.data?.pagination?.totalPages ?? 1;
          if (page < totalPages && page < 10) {
            fetchPage(page + 1);
            return;
          }
          this.craftsmen = all.map((a) => this.mapArtisan(a));
          this.updateSpecialtyCounts();
          this.loading = false;
          const target = this.pendingArtisanId
            ? this.craftsmen.find((c) => c.id === this.pendingArtisanId)
            : null;
          if (target) {
            this.pendingArtisanId = '';
            this.openProfile(target);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.craftsmen = [];
          this.loadError = error?.error?.message || 'مش قادرين نجيب الأسطوات دلوقتي، حاول تاني.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    };

    fetchPage(1);
  }

  private professionSlug(profession: string): string {
    const value = (profession || '').trim().toLowerCase();
    const bySlug = SPECIALTY_DEFS.find((d) => d.slug === value);
    if (bySlug) return bySlug.slug;
    const byKeyword = SPECIALTY_DEFS.find((d) => d.keywords.some((k) => value.includes(k)));
    return byKeyword ? byKeyword.slug : value;
  }

  private professionLabel(profession: string): string {
    const slug = this.professionSlug(profession);
    const def = SPECIALTY_DEFS.find((d) => d.slug === slug);
    return def ? def.name : profession || 'أسطى';
  }

  private imageUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
    return path;
  }

  private mapArtisan(a: any): GuideCraftsman {
    const years = Number(a.experienceYears ?? 0);
    const skills: string[] = Array.isArray(a.skills) ? a.skills : [];
    const areas: string[] = Array.isArray(a.serviceAreas) ? a.serviceAreas.filter(Boolean) : [];
    const title = this.professionLabel(a.profession);
    const verified = !!a.isVerified;

    return {
      id: String(a.id),
      slug: this.professionSlug(a.profession),
      name: a.name || 'أسطى',
      title,
      verified,
      specialty: a.bio || skills.join('، ') || title,
      rating: Math.round(Number(a.rating ?? 0) * 100) / 100,
      reviewCount: Number(a.totalReviews ?? 0),
      responseTime: '',
      location: a.location || areas.join('، ') || 'مصر',
      distance: '',
      distanceValue: null,
      priceFrom: Number(a.hourlyRate ?? 0),
      experience: years > 0 ? `${years} ${years === 1 ? 'سنة' : years <= 10 ? 'سنوات' : 'سنة'}` : null,
      guarantee: null,
      photosCount: 0,
      tags: skills.slice(0, 3),
      photos: [],
      avatar: this.imageUrl(a.avatar),
      available: true,
      credentials: verified ? ['فيش وتشبيه مفحوص أمنياً', 'شهادة قياس مهارة وخبرة'] : [],
    };
  }

  private updateSpecialtyCounts(): void {
    this.specialties.forEach((s) => {
      s.count = this.craftsmen.filter((c) => c.slug === s.slug).length;
    });
  }

  // =========================
  // FILTER + SEARCH + SORT
  // =========================

  get filteredCraftsmen() {
    let result = [...this.craftsmen];

    // Specialty filter
    if (this.selectedSpecialty) {
      const selected = this.specialties.find((s) => s.name === this.selectedSpecialty);
      if (selected) {
        result = result.filter((c) => c.slug === selected.slug);
      }
    }

    // Location filter
    if (this.selectedLocation) {
      const locationWords = this.selectedLocation
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word) => word.length > 2);

      result = result.filter((c) =>
        locationWords.some((word) => c.location.toLowerCase().includes(word)),
      );
    }

    // Distance
    // (مفيش بيانات مسافة في الباك، فالفلتر بيتطبق بس لما المسافة تبقى متاحة)
    result = result.filter((c) => c.distanceValue === null || c.distanceValue <= this.distanceRange);

    // Price
    // الأسطى اللي سعره "حسب الاتفاق" (0) بيظهر دايمًا
    result = result.filter(
      (c) => !c.priceFrom || (c.priceFrom >= this.priceMin && c.priceFrom <= this.priceMax),
    );

    // Security check
    if (this.credentialsFilters.securityChecked) {
      result = result.filter((c) => c.credentials.includes('فيش وتشبيه مفحوص أمنياً'));
    }

    // Skill certificate
    if (this.credentialsFilters.skillCertificate) {
      result = result.filter((c) => c.credentials.includes('شهادة قياس مهارة وخبرة'));
    }

    // Experience
    if (this.credentialsFilters.experience7Years) {
      result = result.filter((c) => this.getExperienceYears(c.experience) >= 7);
    }

    // Guarantee
    if (this.credentialsFilters.invoiceGuarantee) {
      result = result.filter((c) => !!c.guarantee);
    }

    // Search specialty
    if (this.searchSpecialty.trim()) {
      const searchWords = this.searchSpecialty
        .trim()
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word) => word.length > 1);

      result = result.filter((c) =>
        searchWords.some(
          (word) =>
            c.name.toLowerCase().includes(word) ||
            c.title.toLowerCase().includes(word) ||
            c.specialty.toLowerCase().includes(word) ||
            c.tags.some((tag) => tag.toLowerCase().includes(word)),
        ),
      );
    }

    // Search location
    if (this.searchLocation.trim()) {
      const locationWords = this.searchLocation
        .trim()
        .toLowerCase()
        .split(/[،,\s]+/)
        .filter((word) => word.length > 1);

      result = result.filter((c) =>
        locationWords.some((word) => c.location.toLowerCase().includes(word)),
      );
    }

    // Sorting
    switch (this.sortBy) {
      case 'الأفضل تقييماً':
        result.sort((a, b) => b.rating - a.rating);

        break;

      case 'الأقرب إليك':
        result.sort((a, b) => (a.distanceValue ?? 9999) - (b.distanceValue ?? 9999));

        break;

      case 'الأسرع رداً':
        result.sort(
          (a, b) =>
            this.getResponseMinutes(a.responseTime || '') -
            this.getResponseMinutes(b.responseTime || ''),
        );

        break;

      case 'الأقل سعراً':
        result.sort((a, b) => (a.priceFrom || 999999) - (b.priceFrom || 999999));

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
    const wasSelected = specialty.selected;

    this.specialties.forEach((s) => (s.selected = false));

    specialty.selected = !wasSelected;

    this.selectedSpecialty = wasSelected ? '' : specialty.name;

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

  // =========================
  // ACTIONS (ربط الأزرار)
  // =========================

  // "إحجزه فوري" و "انشر شغلتك دلوقتي": العميل بيفتح نموذج طلب جديد، غير كده يروح تسجيل الدخول
  goToNewRequest(): void {
    const go = (role?: string) => {
      if (role === 'customer') {
        this.router.navigate(['/customer-dashboard'], { queryParams: { newRequest: 'true' } });
      } else if (role === 'artisan') {
        this.router.navigate(['/dashboard/available-requests']);
      } else {
        this.router.navigate(['/login']);
      }
    };

    const user = this.auth.currentUserValue;
    if (user) {
      go(user.role);
      return;
    }
    this.auth.fetchCurrentUser().subscribe((me) => go(me?.role));
  }

  // "شوف شغله وتقييماته"
  openProfile(c: GuideCraftsman, event?: Event): void {
    event?.preventDefault();
    this.profileOpen = true;
    this.profileLoading = true;
    this.profileError = '';
    this.profile = { ...c, reviews: [] };
    document.body.style.overflow = 'hidden';

    this.marketplace.getArtisan(c.id).subscribe({
      next: (response) => {
        const data = response?.data;
        this.profile = {
          ...c,
          bio: data?.bio || '',
          rating: Math.round(Number(data?.rating ?? c.rating) * 100) / 100,
          reviewCount: Number(data?.totalReviews ?? c.reviewCount),
          reviews: data?.reviews ?? [],
        };
        this.profileLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.profileError = error?.error?.message || 'مش قادرين نجيب بيانات الأسطى دلوقتي.';
        this.profileLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeProfile(): void {
    this.profileOpen = false;
    this.profile = null;
    document.body.style.overflow = '';
  }

  starsFor(value: number): string {
    const full = Math.round(Math.max(0, Math.min(5, value)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
