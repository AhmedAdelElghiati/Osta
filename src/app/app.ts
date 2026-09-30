// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { NavbarComponent } from './shared/navbar/navbar.component';
// import { FooterComponent } from './shared/footer/footer.component';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterOutlet, NavbarComponent, FooterComponent],
//   templateUrl: './app.html',
//   styleUrl: './app.css'
// })
// export class App {
// }



import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { Chatbot } from './pages/chatbot/chatbot'; // ⚠️ عدّل المسار حسب مكان الملف

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
export class App {}