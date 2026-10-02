import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Step {
  num: string;
  icon:
    | 'edit'
    | 'quote'
    | 'lock'
    | 'tools'
    | 'check'
    | 'wallet'
    | 'briefcase'
    | 'star'
    | 'handshake'
    | 'trophy';
  title: string;
  desc: string;
  note: string;
  noteIcon: 'shield' | 'clock' | 'star';
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
})
export class HowItWorks {
  activeTab = signal<'client' | 'craftsman'>('client');

  // ============ رحلة صاحب البيت / المنشأة ============
  clientSteps: Step[] = [
    {
      num: '٠١',
      icon: 'edit',
      title: 'احكي المشكلة وانشر طلبك',
      desc: 'اكتب اللي محتاجه بالتفصيل، ارفع صورة أو فيديو يوضّح العطل، وحدد الميعاد المناسب لوجودك في البيت.',
      note: 'بتأخد دقايق بس',
      noteIcon: 'clock',
    },
    {
      num: '٠٢',
      icon: 'quote',
      title: 'استقبل عروض ومقايسات',
      desc: 'قارن الأسعار ومواعيد التنفيذ، شوف تقييم كل صنايعي، وراجع تفاصيل الأسعار والضمانات قبل ما تقرر.',
      note: 'خبرات موثقة بالصور',
      noteIcon: 'star',
    },
    {
      num: '٠٣',
      icon: 'lock',
      title: 'احجز المعاينة وأودع الضمان',
      desc: 'أكّد الاتفاق بالمبلغ المتفق عليه، فلوسك بتتحفظ مباشرة في أمانة المنصة ومتتحولش للصنايعي إلا بعد ما تخلص.',
      note: 'حفظ حق الطرفين',
      noteIcon: 'shield',
    },
    {
      num: '٠٤',
      icon: 'tools',
      title: 'المعاينة وتنفيذ الشغلات',
      desc: 'الصنايعي بيتواصل معاك في الميعاد، بيعاين، بيتفق معاك على كل تفصيلة، ويبدأ الشغل بكل ضمانات.',
      note: 'إلزام بمواعيد بالوقت',
      noteIcon: 'clock',
    },
    {
      num: '٠٥',
      icon: 'check',
      title: 'استلم على الفرازه وحوّل الحساب',
      desc: 'بعد التنفيذ، اتأكد إن الشغل تمام، وبعدها بتحرر المبلغ للصنايعي، وبتحصل على ضمان ما بعد التسليم.',
      note: 'ضمان شامل ١٤ يوم',
      noteIcon: 'shield',
    },
  ];

  // ============ رحلة الأسطى / الحرفي الشاطر ============
  craftsmanSteps: Step[] = [
    {
      num: '٠١',
      icon: 'briefcase',
      title: 'اعمل بروفايل محترف',
      desc: 'سجّل تخصصك، ارفع صور لأعمالك السابقة، ووثّق خبراتك عشان العملاء يثقوا فيك من أول نظرة.',
      note: 'بروفايل موثّق ومميز',
      noteIcon: 'star',
    },
    {
      num: '٠٢',
      icon: 'star',
      title: 'تصفّح الشغلات وقدّم مقايساتك',
      desc: 'اختار الشغلات اللي تناسب تخصصك ومنطقتك، وقدّم عرض سعر واضح بالتفاصيل وموعد التنفيذ.',
      note: 'عروض محددة وواضحة',
      noteIcon: 'clock',
    },
    {
      num: '٠٣',
      icon: 'handshake',
      title: 'اتفق مع العميل وابدأ الشغل',
      desc: 'بعد ما العميل يقبل عرضك، بتتحفظ الفلوس في أمانة المنصة، وتقدر تبدأ الشغل وأنت مطمن على مستحقاتك.',
      note: 'ضمان المستحقات ١٠٠٪',
      noteIcon: 'shield',
    },
    {
      num: '٠٤',
      icon: 'tools',
      title: 'نفّذ الشغل بأعلى جودة',
      desc: 'نفّذ المهمة في الميعاد المتفق عليه، وخلّي العميل يتابع كل تفصيلة وتكون على تواصل دائم معاه.',
      note: 'التزام بمواعيد التسليم',
      noteIcon: 'clock',
    },
    {
      num: '٠٥',
      icon: 'trophy',
      title: 'استلم فلوسك وابنِ سمعتك',
      desc: 'بعد تسليم الشغل، بتستلم مستحقاتك كاملة فوراً، وتاخد تقييم من العميل يرفع ترتيبك في المنصة.',
      note: 'تقييم يرفع ترتيبك',
      noteIcon: 'star',
    },
  ];
  openFaq: number | null = null;

  toggleFaq(index: number) {
    this.openFaq = this.openFaq === index ? null : index;
  }
  currentSteps = computed<Step[]>(() =>
    this.activeTab() === 'client' ? this.clientSteps : this.craftsmanSteps,
  );

  setTab(tab: 'client' | 'craftsman') {
    this.activeTab.set(tab);
  }
}
