import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';
import { API_ORIGIN } from '../../core/api.config';
import { Chat } from '../../services/chat';

@Component({
  selector: 'app-craftsmen-guide', standalone: true, imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './craftsmen-guide.html', styleUrl: './craftsmen-guide.css',
})
export class CraftsmenGuide implements OnInit {
  private api = inject(Marketplace);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private chat = inject(Chat);
  contacting = false;
  contactArtisan(id: string) {
    const user = this.auth.currentUserValue;
    if (!user) { this.router.navigate(['/login'], { queryParams: { returnUrl: '/craftsmen-guide?artisan=' + id } }); return; }
    if (user.role !== 'customer') { this.error = 'التواصل المباشر متاح من حساب العميل.'; return; }
    if (this.contacting) return;
    this.contacting = true;
    this.chat.startDirect(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: conversation => { this.contacting = false; this.closeProfile(); this.router.navigate(['/customer-dashboard'], { queryParams: { page: 'chat', conversation } }); },
      error: err => { this.contacting = false; this.error = err.error?.message || 'تعذر فتح المحادثة.'; this.cdr.markForCheck(); },
    });
  }
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  searchSpecialty = '';
  searchLocation = '';
  sortBy = 'rating';
  priceMin: number | null = null;
  priceMax: number | null = null;
  verifiedOnly = false;
  experiencedOnly = false;
  currentPage = 1;
  total = 0;
  totalPages = 1;
  loading = false;
  error = '';
  craftsmen: any[] = [];
  selectedArtisan: any = null;
  reviews: any[] = [];
  profileLoading = false;
  reviewsLoading = false;
  reviewsError = '';
  @ViewChild('profileClose') set profileClose(element: ElementRef<HTMLButtonElement> | undefined) { element?.nativeElement.focus(); }
  private profileVersion = 0;
  private previousFocus: HTMLElement | null = null;
  closeProfile() { this.profileVersion++; this.selectedArtisan = null; this.previousFocus?.focus(); }
  private requestVersion = 0;
  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.searchSpecialty = params['specialty'] || '';
      this.searchLocation = params['location'] || '';
      this.search();
      if (params['artisan']) this.viewProfile(params['artisan']);
    });
  }
  load() {
    this.loading = true; this.error = '';
    const version = ++this.requestVersion;
    this.api.listArtisans({ search: this.searchSpecialty, area: this.searchLocation,
      sort: this.sortBy, verified: this.verifiedOnly ? 'true' : '',
      minExperience: this.experiencedOnly ? 7 : '', minPrice: this.priceMin ?? '',
      maxPrice: this.priceMax ?? '', page: this.currentPage, limit: 12
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (version !== this.requestVersion) return;
        this.craftsmen = res.data.items; this.total = res.data.pagination.total;
        this.totalPages = res.data.pagination.totalPages; this.loading = false; this.cdr.markForCheck();
      },
      error: () => {
        if (version !== this.requestVersion) return;
        this.loading = false; this.craftsmen = []; this.error = 'تعذر تحميل الأسطوات. حاول مرة أخرى.';
        this.cdr.markForCheck();
      }
    });
  }
  search() { this.currentPage = 1; this.load(); }
  goToPage(page: number) { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.load(); } }
  imageUrl(image: string) { return image.startsWith('/uploads/') ? API_ORIGIN + image : image; }
  viewProfile(id: string) {
    const version = ++this.profileVersion;
    this.previousFocus = document.activeElement as HTMLElement;
    this.reviewsError = ''; this.reviewsLoading = true;
    this.profileLoading = true; this.reviews = [];
    this.api.getArtisan(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (version !== this.profileVersion) return;
        this.selectedArtisan = res.data; this.profileLoading = false; this.cdr.markForCheck();
        this.api.getArtisanReviews(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: response => { if (version !== this.profileVersion) return; this.reviews = response.data || []; this.reviewsLoading = false; this.cdr.markForCheck(); },
          error: () => { if (version !== this.profileVersion) return; this.reviewsLoading = false; this.reviewsError = 'تعذر تحميل التقييمات.'; this.cdr.markForCheck(); }
        });
      },
      error: () => { this.profileLoading = false; this.error = 'تعذر تحميل بيانات الأسطى.'; this.cdr.markForCheck(); }
    });
  }
  postRequest() { this.router.navigate([this.auth.currentUserValue?.role === 'customer' ? '/customer-dashboard' : '/login']); }
}
