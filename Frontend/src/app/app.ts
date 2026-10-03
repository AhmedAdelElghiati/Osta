import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar';
import { FooterComponent } from './shared/footer/footer.component';
import { Chatbot } from './pages/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    Chatbot
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {}

  get hidePublicShell(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return (
      path.startsWith('/customer-dashboard') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/craftsman-dashboard') ||
      path.startsWith('/admin-dashboard')
    );
  }
}
