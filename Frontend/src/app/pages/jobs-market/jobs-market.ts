import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Marketplace } from '../../services/marketplace';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  postedAt: string;
  daysOpen: number;
  offers: number;
  urgent: boolean;
  tags: string[];
  images?: string[];
  imagesCount: number;
}

@Component({
  selector: 'app-jobs-market',
  imports: [DecimalPipe, RouterLink],
  styleUrl: './jobs-market.css',
  templateUrl: './jobs-market.html',
})
export class JobsMarket {
  activeTab = signal('all');
  selectedCategory = signal('all');
  selectedLocation = signal('');
  selectedBudget = signal('all');
  sortBy = signal('newest');
  currentPage = signal(1);

  pageSize = 5;
  loading = signal(false);
  error = signal('');
  jobs = signal<Job[]>([]);

  constructor(
    private marketplace: Marketplace,
    private router: Router,
  ) {
    this.loadJobs();
  }

  get tabs() {
    const jobs = this.jobs();
    return [
      { key: 'all', label: 'كل الشغلانات', count: jobs.length },
      { key: 'urgent', label: 'شغلانات مستعجلة وجاهزة إنجاز', count: jobs.filter((job) => job.urgent).length },
      { key: 'big', label: 'تشطيبات وديكورات كبيرة', count: jobs.filter((job) => job.budgetMax >= 5000).length },
    ];
  }

  categories = computed(() => {
    const names = new Set(this.jobs().map((job) => job.category).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ar'));
  });

  filteredJobs = computed(() => {
    const tab = this.activeTab();
    const category = this.selectedCategory();
    const location = this.selectedLocation().trim().toLowerCase();
    const budget = this.selectedBudget();

    let list = this.jobs().filter((job) => {
      if (tab === 'urgent' && !job.urgent) return false;
      if (tab === 'big' && job.budgetMax < 5000) return false;
      if (category !== 'all' && job.category !== category) return false;
      if (location && !job.location.toLowerCase().includes(location) && !job.city.toLowerCase().includes(location)) return false;
      if (budget !== 'all') {
        if (budget === '20000+') return job.budgetMax > 20000;
        if (job.budgetMax > Number(budget)) return false;
      }
      return true;
    });

    if (this.sortBy() === 'budget') {
      list = [...list].sort((a, b) => b.budgetMax - a.budgetMax);
    }

    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredJobs().length / this.pageSize)));

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  paginatedJobs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredJobs().slice(start, start + this.pageSize);
  });

  loadJobs(): void {
    this.loading.set(true);
    this.error.set('');
    this.marketplace.listMarket({ limit: 50 }).subscribe({
      next: (response) => {
        const items = response?.data?.items ?? [];
        this.jobs.set(items.map((item: any) => this.mapJob(item)));
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('مش قادرين نجيب سوق الشغلانات دلوقتي.');
        this.jobs.set([]);
        this.loading.set(false);
      },
    });
  }

  setTab(key: string) {
    this.activeTab.set(key);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.currentPage() > 1) this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.goToPage(this.currentPage() + 1);
  }

  openArtisanDashboard() {
    this.router.navigate(['/dashboard/available-requests']);
  }

  private mapJob(raw: any): Job {
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : null;
    const daysOpen = createdAt
      ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;
    const budgetMin = Number(raw.budget?.min ?? 0);
    const budgetMax = Number(raw.budget?.max ?? budgetMin);
    const category = raw.craft?.name ?? 'خدمة عامة';
    const city = raw.city ?? '';
    const area = raw.area ?? '';

    return {
      id: String(raw.id),
      title: raw.title ?? '',
      description: raw.description ?? '',
      category,
      city,
      location: [area, city].filter(Boolean).join(' - ') || 'مصر',
      budgetMin,
      budgetMax,
      postedAt: daysOpen === 0 ? 'النهارده' : `منذ ${daysOpen} يوم`,
      daysOpen,
      offers: Number(raw.offerCount ?? 0),
      urgent: daysOpen === 0,
      tags: [category, city].filter(Boolean),
      images: [],
      imagesCount: Number(raw.photoCount ?? 0),
    };
  }
}
