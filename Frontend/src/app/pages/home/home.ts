import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

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
  stats: any = null;

  constructor(private router: Router, private api: Marketplace) {}

  ngOnInit(): void {
    this.api.marketStats().subscribe({ next: (r: any) => (this.stats = r?.data ?? null) });
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

  goToCraftsmanRegister(): void {
    this.router.navigate(['/craftsman-register']);
  }

  openNewRequest() {
    this.router.navigate(['/customer-dashboard'], {
      queryParams: { newRequest: 'true' },
    });
  }
}
