import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {
  currentUser$;

  constructor(
    private auth: Auth,
    private router: Router,
  ) {
    this.currentUser$ = this.auth.currentUser$;
  }

  ngOnInit(): void {
    this.auth.fetchCurrentUser().subscribe();
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/']),
    });
  }
}
