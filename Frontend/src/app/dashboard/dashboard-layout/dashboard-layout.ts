// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// import { DashboardSidebar } from '../dashboard-sidebar/dashboard-sidebar';
// import { DashboardNavbar } from '../dashboard-navbar/dashboard-navbar';

// @Component({
//   selector: 'app-dashboard-layout',
//   standalone: true,
//   imports: [
//     RouterOutlet,
//     DashboardSidebar,
//     DashboardNavbar
//   ],
//   templateUrl: './dashboard-layout.html',
//   styleUrl: './dashboard-layout.css'
// })
// export class DashboardLayout {

// }

import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DashboardSidebar } from '../dashboard-sidebar/dashboard-sidebar';
import { DashboardNavbar } from '../dashboard-navbar/dashboard-navbar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DashboardSidebar,
    DashboardNavbar
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayout {

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  /** يقفل السايدبار لو الشاشة كبرت لـ lg */
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 1024 && this.sidebarOpen) {
      this.sidebarOpen = false;
    }
  }

  /** يقفل بـ Escape */
  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeSidebar();
  }
}