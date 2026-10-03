import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';
import { API_ORIGIN } from '../../core/api.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  searchSpecialty = '';
  searchLocation = '';

  // أفضل الأسطوات من الباك: GET /api/v1/artisans
  featured: {
    id: string;
    name: string;
    title: string;
    experience: string;
    rating: number;
    description: string;
    avatar: string;
  }[] = [];

  private readonly professionNames: Record<string, string> = {
    plumbing: 'سباكة وصرف صحي',
    electricity: 'كهرباء وتأسيس',
    carpentry: 'نجارة وأثاث',
    painting: 'نقاشة ودهانات',
    'air-conditioning': 'تكييف وأجهزة منزلية',
    aluminum: 'ألوميتال وشبابيك',
  };

  constructor(
    private router: Router,
    private marketplace: Marketplace,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.marketplace.listArtisans({ limit: 3 }).subscribe({
      next: (response) => {
        const items: any[] = response?.data?.items ?? [];
        this.featured = items.map((a) => {
          const years = Number(a.experienceYears ?? 0);
          const skills: string[] = Array.isArray(a.skills) ? a.skills : [];
          const avatar = a.avatar
            ? a.avatar.startsWith('/')
              ? `${API_ORIGIN}${a.avatar}`
              : a.avatar
            : '';
          return {
            id: String(a.id),
            name: a.name,
            title: this.professionNames[a.profession] ?? a.profession ?? 'أسطى',
            experience: years > 0 ? `${years} سنة خبرة` : '',
            rating: Math.round(Number(a.rating ?? 0) * 100) / 100,
            description: a.bio || skills.join('، ') || 'أسطى معتمد على منصة أُسطى.',
            avatar,
          };
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.featured = [];
        this.cdr.markForCheck();
      },
    });
  }

  searchCraftsman(): void {
    this.router.navigate(['/craftsmen-guide'], {
      queryParams: {
        specialty: this.searchSpecialty,
        location: this.searchLocation,
      },
    });
  }

  goToMaadi(): void {
    this.router.navigate(['/craftsmen-guide'], {
      queryParams: {
        location: 'المعادي',
      },
    });
  }

  goToAllAreas(): void {
    this.router.navigate(['/craftsmen-guide']);
  }

  goToCraftsmen(): void {
    this.router.navigate(['/craftsmen-guide']);
  }

  openGuide(): void {
    this.router.navigate(['/craftsmen-guide']);
  }

  // "اتفق مع الأسطى": العميل يفتح طلب جديد، غير كده تسجيل الدخول
  agreeWith(): void {
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

  goToCraftsmanRegister(): void {
    this.router.navigate(['/craftsman-register']);
  }
}
