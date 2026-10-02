import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
})
export class ContactUs {
  contactType: 'business' | 'personal' | 'company' = 'business';

  fullName = '';
  phone = '';
  subject = '';
  message = '';
  partNumber = '';

  submitted = false;
  successMessage = '';
  errorMessage = '';
  sending = false;

  constructor(private api: Marketplace) {}

  // =========================
  // Coverage Areas
  // =========================

  branches = [
    {
      region: 'القاهرة الكبرى',
      address: 'القاهرة الجديدة، المعادي، المهندسين',
    },
    {
      region: 'الإسكندرية والساحل',
      address: 'الإسكندرية ومناطق الساحل الشمالي',
    },
    {
      region: 'محافظات الدلتا',
      address: 'طنطا، المنصورة، الزقازيق',
    },
    {
      region: 'مدن القناة والصعيد',
      address: 'الإسماعيلية، أسيوط، سوهاج',
    },
  ];

  // =========================
  // FAQ
  // =========================

  faqItems = [
    {
      question: 'لو الأسطى اتأخر عن ميعاده، أعمل إيه؟',
      answer:
        'تقدر تتابع حالة الطلب من خلال المنصة، ولو حصل تأخير تقدر تتواصل مع خدمة العملاء، وإحنا نساعدك في حل المشكلة وتوفير أسطى بديل عند الحاجة.',
    },
    {
      question: 'مين بيشتري الخامات وقطع الغيار؟',
      answer:
        'الاختيار يرجعلك. تقدر تشتري الخامات بنفسك، أو تطلب من الأسطى توفيرها حسب الاتفاق، مع توضيح التكلفة قبل تنفيذ الخدمة.',
    },
    {
      question: 'لو الشغلانة مخلصتش بالشكل المطلوب، أعمل إيه؟',
      answer:
        'لو الخدمة لم تُنفذ بالشكل المتفق عليه، تقدر تتواصل مع خدمة العملاء، ونراجع المشكلة معك ونساعد في حلها وفقًا للضمان المتفق عليه.',
    },
    {
      question: 'إزاي أتأكد إن الأسطى محترم وأمين في البيت؟',
      answer:
        'الأسطوات المعتمدون بيتم مراجعة بياناتهم والتحقق من هويتهم وخبراتهم قبل اعتمادهم، بالإضافة إلى وجود تقييمات وآراء العملاء.',
    },
    {
      question: 'إزاي أعمل ميعاد؟',
      answer:
        'ابحث عن الأسطى المناسب، واختار الموعد المتاح المناسب لك، ثم أكد الحجز من خلال المنصة.',
    },
    {
      question: 'هل بتوفروا ضمان على الشغل؟',
      answer: 'نعم، الضمان يختلف حسب نوع الخدمة والأسطى، وتظهر تفاصيل الضمان قبل تأكيد الخدمة.',
    },
  ];

  // =========================
  // Phone Validation
  // =========================

  isValidPhone(): boolean {
    return /^01[0125][0-9]{8}$/.test(this.phone.trim());
  }

  // =========================
  // Reference Number Validation
  // =========================

  isValidPartNumber(): boolean {
    if (!this.partNumber.trim()) {
      return true;
    }

    return /^EG-\d{5}$/i.test(this.partNumber.trim());
  }

  // =========================
  // Submit — POST /api/v1/contact
  // =========================

  submitForm(form: NgForm) {
    this.submitted = true;

    this.successMessage = '';
    this.errorMessage = '';

    // Basic Angular validation
    if (form.invalid) {
      this.errorMessage = 'من فضلك راجع البيانات المطلوبة قبل إرسال الرسالة.';

      return;
    }

    const cleanName = this.fullName.trim();
    const cleanPhone = this.phone.trim();
    const cleanMessage = this.message.trim();
    const cleanPartNumber = this.partNumber.trim();

    // Name
    if (cleanName.length < 3) {
      this.errorMessage = 'من فضلك اكتب الاسم بالكامل بشكل صحيح.';

      return;
    }

    // Phone
    if (!this.isValidPhone()) {
      this.errorMessage = 'من فضلك اكتب رقم موبايل مصري صحيح مكوّن من 11 رقم.';

      return;
    }

    // Message
    if (cleanMessage.length < 10) {
      this.errorMessage = 'من فضلك اكتب تفاصيل الرسالة بشكل أوضح.';

      return;
    }

    // Reference Number
    if (!this.isValidPartNumber()) {
      this.errorMessage = 'رقم الاتفاقية يجب أن يكون بالشكل EG-12345.';

      return;
    }

    this.sending = true;
    this.api
      .sendContact({
        fullName: cleanName,
        phone: cleanPhone,
        contactType: this.contactType,
        subject: this.subject,
        partNumber: cleanPartNumber,
        message: cleanMessage,
      })
      .subscribe({
        next: (res: any) => {
          this.sending = false;
          this.successMessage = res?.message || 'تم إرسال رسالتك بنجاح، وهنتواصل معاك في أقرب وقت.';
          this.errorMessage = '';
          form.resetForm({
            contactType: 'business',
            fullName: '',
            phone: '',
            subject: '',
            partNumber: '',
            message: '',
          });
          this.contactType = 'business';
          this.submitted = false;
        },
        error: (err) => {
          this.sending = false;
          this.errorMessage = err?.error?.message || 'تعذر إرسال الرسالة، حاول مرة أخرى.';
        },
      });
  }
}

