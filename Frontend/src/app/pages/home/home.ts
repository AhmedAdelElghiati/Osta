import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';
import { API_ORIGIN } from '../../core/api.config';
import { Auth } from '../../services/auth';

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

  constructor(private router: Router, private api: Marketplace, private cdr: ChangeDetectorRef, private auth: Auth) {}
  stats: any = null;
  featured: any[] = [];
  statsError = '';
  statsLoading = true;
  featuredError = '';
  ngOnInit() {
    this.api.platformStats().subscribe({
      next: res => { this.stats = res.data; this.statsLoading = false; this.cdr.markForCheck(); },
      error: () => { this.statsLoading = false; this.statsError = 'تعذر تحميل الإحصائيات.'; this.cdr.markForCheck(); },
    });
    this.api.listArtisans({ sort: 'rating', limit: 3 }).subscribe({
      next: res => { this.featured = res.data.items; this.cdr.markForCheck(); },
      error: () => { this.featuredError = 'تعذر تحميل الأسطوات.'; this.cdr.markForCheck(); },
    });
  }
  imageUrl(image: string) { return image.startsWith('/uploads/') ? API_ORIGIN + image : image; }
  postRequest() { this.router.navigate([this.auth.currentUserValue?.role === 'customer' ? '/customer-dashboard' : '/login']); }

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

  goToCraftsmanRegister(): void {
    this.router.navigate(['/craftsman-register']);
  }
}
