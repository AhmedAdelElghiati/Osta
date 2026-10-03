import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OffersService } from '../Service/offers.service';
import { Request } from '../Service/requests.service';

@Component({
  selector: 'app-offer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offer-modal.html',
  styleUrl: './offer-modal.css'
})
export class OfferModal {

  private offersService = inject(OffersService);

  @Input({ required: true }) request!: Request;
  @Output() closed = new EventEmitter<void>();
  @Output() sent = new EventEmitter<{ price: number; client: string }>();

  durations = ['نصف يوم', 'يوم واحد', 'يومان', '3 أيام', 'أسبوع', 'أسبوعين'];
  warranties = ['شهر', '3 شهور', '6 شهور', 'سنة'];

  rows: { desc: string; amount: number | null }[] = [
    { desc: 'معاينة وكشف الموقع', amount: null },
    { desc: 'المواد والخامات', amount: null },
    { desc: 'أجرة التنفيذ', amount: null }
  ];

  duration = 'يوم واحد';
  warranty = '6 شهور';
  msg = '';
  error = '';
  submitting = false;

  get total() {
    return this.rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  }

  addRow() {
    this.rows.push({ desc: '', amount: null });
  }

  removeRow(i: number) {
    this.rows.splice(i, 1);
  }

  submit() {
    const rows = this.rows
      .filter(r => r.desc.trim() && Number(r.amount) > 0)
      .map(r => [r.desc.trim(), Number(r.amount)] as [string, number]);

    const price = rows.reduce((s, r) => s + r[1], 0);

    if (!price) {
      this.error = 'اكتب بنود المقايسة وأسعارها الأول';
      return;
    }

    this.submitting = true;
    this.error = '';

    this.offersService.submit({
      reqId: this.request.id,
      title: this.request.title,
      client: this.request.client,
      area: this.request.area,
      price,
      duration: this.duration,
      warranty: this.warranty,
      rows,
      msg: this.msg.trim()
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.sent.emit({ price, client: this.request.client });
        this.closed.emit();
      },
      error: (error) => {
        this.submitting = false;
        this.error = error?.error?.message || 'تعذر إرسال العرض دلوقتي.';
      },
    });
  }
}
