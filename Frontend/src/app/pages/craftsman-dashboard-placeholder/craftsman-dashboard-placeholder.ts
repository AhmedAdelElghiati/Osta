import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// صفحة placeholder مؤقتة لحد ما أشرف يخلص لوحة تحكم الحرفي الحقيقية.
// اليوزر اللي دوره artisan بيتحول هنا بعد اللوجين بدل ما يوصله 404.
@Component({
  selector: 'app-craftsman-dashboard-placeholder',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './craftsman-dashboard-placeholder.html',
  styleUrl: './craftsman-dashboard-placeholder.css',
})
export class CraftsmanDashboardPlaceholder {}
