import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  searchSpecialty = '';
  searchLocation = '';

  constructor(private router: Router) {}

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
