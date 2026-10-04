import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  readonly team = [
    { name: 'أحمد عادل', initials: 'أ ع', role: 'Software Engineer & Code Instructor', arabicRole: 'مهندس برمجيات ومدرّس برمجة', color: 'teal' },
    { name: 'أشرف حلاوة', initials: 'أ ح', role: 'Full Stack Developer', arabicRole: 'مطوّر واجهات وأنظمة خلفية', color: 'blue' },
    { name: 'علا عادل', initials: 'ع ع', role: 'Full Stack Developer', arabicRole: 'مطوّرة واجهات وأنظمة خلفية', color: 'rose' },
  ];
}
