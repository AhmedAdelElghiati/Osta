import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';

interface Developer {
  name: string;
  role: string;
  bio: string;
  longBio: string;
  images: string[];
  skills: { name: string; level: number; }[];
  social: {
    github?: string;
    linkedin?: string;
    facebook?: string;
    email?: string;
  };
  gradient: string;
  glow: string;
  quote: string;
}

interface Counter {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

interface WorkflowItem {
  number: string;
  icon: string;
  title: string;
  text: string;
}

interface TechItem {
  name: string;
  icon: string;
  color: string;
}

interface TitleBlockRow {
  key: string;
  value: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './developers.html',
  styleUrl: './developers.css'
})
export class Developers implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('particlesCanvas', { static: false }) particlesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hero', { static: false }) hero!: ElementRef<HTMLElement>;
  @ViewChild('statsSection', { static: false }) statsSection!: ElementRef<HTMLElement>;
  @ViewChild('progress', { static: false }) progress!: ElementRef<HTMLElement>;
  @ViewChild('crossV', { static: false }) crossV!: ElementRef<HTMLElement>;
  @ViewChild('crossH', { static: false }) crossH!: ElementRef<HTMLElement>;
  @ViewChild('crossRead', { static: false }) crossRead!: ElementRef<HTMLElement>;

  /* =========================
     HERO TYPING
  ========================= */

  typedText = '';
  private fullText = 'تيم مطوريين الأسطى';
  private typingIndex = 0;
  private typingTimer: any;

  /* =========================
     HERO TITLE BLOCK
  ========================= */

  titleBlock: TitleBlockRow[] = [
    { key: 'المشروع', value: 'منصة حرفتي' },
    { key: 'رسم بواسطة', value: 'فريق الأسطى' },
    { key: 'المرحلة', value: 'قيد التنفيذ' },
    { key: 'الإصدار', value: 'v1.0' }
  ];

  /* =========================
     COUNTERS
  ========================= */

  counters: Counter[] = [
    { value: 3, suffix: '', label: 'مطورين في الفريق', icon: 'bi-people-fill' },
    { value: 12000, suffix: '+', label: 'سطر كود', icon: 'bi-code-slash' },
    { value: 24, suffix: '/7', label: 'دعم وتطوير', icon: 'bi-headset' },
    { value: 100, suffix: '%', label: 'شغف وإبداع', icon: 'bi-fire' }
  ];

  displayCounters: number[] = [0, 0, 0, 0];
  private countersStarted = false;
  private counterRaf = 0;

  /* =========================
     DEVELOPERS
  ========================= */

  developers: Developer[] = [
    {
      name: 'أشرف حلاوه',
      role: 'Frontend Engineer',
      bio: 'بيحوّل التصاميم لكود نظيف وسريع وتجربة استخدام ممتعة.',
      longBio: 'متخصص في بناء واجهات Angular احترافية باستخدام TypeScript وBootstrap، مهتم بالأداء وتجربة المستخدم والـ animations.',
      images: [],
      skills: [
        { name: 'Angular', level: 95 },
        { name: 'TypeScript', level: 92 },
        { name: 'Bootstrap', level: 90 },
        { name: 'RxJS', level: 85 }
      ],
      social: {
        github: 'https://github.com/',
        linkedin: 'https://linkedin.com/',
        email: 'ashraf@herfaty.com'
      },
      gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
      glow: 'rgba(102,126,234,.55)',
      quote: 'الكود النضيف مش رفاهية، هو احترام للي هيقراه بعدك.'
    },
    {
      name: 'أحمد عادل',
      role: 'Backend Engineer',
      bio: 'بيبني APIs وأنظمة قوية تقدر تستحمل الضغط.',
      longBio: 'مسؤول عن الـ APIs وقواعد البيانات والمنطق البرمجي للمنصة.',
      images: [],
      skills: [
        { name: 'Node.js', level: 93 },
        { name: 'Express', level: 90 },
        { name: 'MongoDB', level: 88 },
        { name: 'REST API', level: 92 }
      ],
      social: {
        github: 'https://github.com/',
        linkedin: 'https://linkedin.com/',
        email: 'ahmed@herfaty.com'
      },
      gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
      glow: 'rgba(245,87,108,.55)',
      quote: 'السيستم الشغال أهم من السيستم المثالي.'
    },
    {
      name: 'علا',
      role: 'UI / UX Designer',
      bio: 'بتحوّل الأفكار لتجارب بسيطة وممتعة.',
      longBio: 'متخصصة في تحويل الأفكار إلى تجارب مستخدم واضحة وجذابة.',
      images: [],
      skills: [
        { name: 'Figma', level: 96 },
        { name: 'Adobe XD', level: 88 },
        { name: 'UI Design', level: 94 },
        { name: 'Prototyping', level: 90 }
      ],
      social: {
        github: 'https://github.com/',
        linkedin: 'https://linkedin.com/',
        email: 'ola@herfaty.com'
      },
      gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
      glow: 'rgba(79,172,254,.55)',
      quote: 'التصميم مش شكل، التصميم إحساس.'
    }
  ];

  selectedDev: Developer | null = null;
  currentImages: string[] = ['', '', ''];

  private imageTimer: any;
  private imageIndexes: number[] = [];
  private lastFocused: HTMLElement | null = null;

  /* =========================
     WORKFLOW
  ========================= */

  workflow: WorkflowItem[] = [
    { number: '01', icon: 'bi-lightbulb', title: 'الفكرة', text: 'بنسمع فكرتك ونحوّلها لخطة واضحة قابلة للتنفيذ.' },
    { number: '02', icon: 'bi-bezier2', title: 'التصميم', text: 'بنرسم تجربة المستخدم ونبني واجهة عصرية ومريحة.' },
    { number: '03', icon: 'bi-code-slash', title: 'التطوير', text: 'بنحوّل التصميم إلى كود نظيف وسريع وقابل للتوسع.' },
    { number: '04', icon: 'bi-rocket-takeoff', title: 'الإطلاق', text: 'بنختبر المنتج ونجهزه للإطلاق والمتابعة والتطوير.' }
  ];

  /* =========================
     TECH STACK
  ========================= */

  techStack: TechItem[] = [
    { name: 'Angular', icon: 'bi-code-square', color: '#ff4d5e' },
    { name: 'TypeScript', icon: 'bi-filetype-tsx', color: '#5ea0ff' },
    { name: 'Node.js', icon: 'bi-server', color: '#7ed37a' },
    { name: 'MongoDB', icon: 'bi-database-fill', color: '#5fd35a' },
    { name: 'Bootstrap', icon: 'bi-bootstrap-fill', color: '#a983ff' },
    { name: 'Git', icon: 'bi-git', color: '#ff7a59' },
    { name: 'Figma', icon: 'bi-vector-pen', color: '#c58aff' },
    { name: 'RxJS', icon: 'bi-arrow-repeat', color: '#ff5cc0' }
  ];

  /** القائمة مكررة عشان الـ marquee يلف من غير قطع */
  marqueeItems: TechItem[] = [...this.techStack, ...this.techStack];

  /* =========================
     CTA
  ========================= */

  contactEmail = 'dev@herfaty.com';
  toastVisible = false;
  private toastTimer: any;

  /* =========================
     INTERNALS
  ========================= */

  private prefersReduced = false;
  private particlesRaf = 0;
  private heroVisible = true;
  private mouse = { x: -9999, y: -9999 };

  private resizeHandler?: () => void;
  private scrollHandler?: () => void;
  private heroMoveHandler?: (e: MouseEvent) => void;
  private heroLeaveHandler?: () => void;

  private revealObserver?: IntersectionObserver;
  private statsObserver?: IntersectionObserver;
  private heroObserver?: IntersectionObserver;

  /* =========================
     TRACK BY
  ========================= */

  trackByIndex(index: number): number { return index; }
  trackByDevName(index: number, dev: Developer): string { return dev.name; }
  trackBySkillName(index: number, skill: { name: string }): string { return skill.name; }
  trackByTechName(index: number, tech: TechItem): string { return tech.name; }
  trackByWorkflowNumber(index: number, item: WorkflowItem): string { return item.number; }
  trackByCounterLabel(index: number, counter: Counter): string { return counter.label; }
  trackByImage(index: number, image: string): string { return image; }
  trackByKey(index: number, row: TitleBlockRow): string { return row.key; }

  /* =========================
     LIFECYCLE
  ========================= */

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.prefersReduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.startTyping();
    this.startImageRotation();
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initParticles();
        this.initHeroTracking();
        this.initScrollReveal();
        this.initStatsObserver();
        this.initScrollProgress();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.typingTimer);
    clearInterval(this.imageTimer);
    clearTimeout(this.toastTimer);
    cancelAnimationFrame(this.particlesRaf);
    cancelAnimationFrame(this.counterRaf);

    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);

    const heroEl = this.hero?.nativeElement;
    if (heroEl && this.heroMoveHandler) heroEl.removeEventListener('mousemove', this.heroMoveHandler);
    if (heroEl && this.heroLeaveHandler) heroEl.removeEventListener('mouseleave', this.heroLeaveHandler);

    this.revealObserver?.disconnect();
    this.statsObserver?.disconnect();
    this.heroObserver?.disconnect();

    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  /* =========================
     TYPING
  ========================= */

  startTyping(): void {
    if (this.prefersReduced) {
      this.typedText = this.fullText;
      return;
    }

    this.typingTimer = setInterval(() => {
      if (this.typingIndex <= this.fullText.length) {
        this.typedText = this.fullText.substring(0, this.typingIndex);
        this.typingIndex++;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.typingTimer);
      }
    }, 90);
  }

  /* =========================
     IMAGE ROTATION
  ========================= */

  startImageRotation(): void {
    const hasAnyImages = this.developers.some(d => d.images && d.images.length > 0);
    if (!hasAnyImages) return;

    this.currentImages = this.developers.map(dev => dev.images?.[0] ?? '');
    this.imageIndexes = this.developers.map(() => 0);

    this.imageTimer = setInterval(() => {
      this.developers.forEach((dev, index) => {
        const count = dev.images?.length ?? 0;
        if (count === 0) return;

        this.imageIndexes[index] = (this.imageIndexes[index] + 1) % count;
        this.currentImages[index] = dev.images[this.imageIndexes[index]];
      });
      this.cdr.detectChanges();
    }, 3500);
  }

  /* =========================
     COUNTERS (بتبدأ لما القسم يظهر)
  ========================= */

  fmt(value: number): string {
    return value.toLocaleString('en-US');
  }

  private startCounters(): void {
    if (this.countersStarted) return;
    this.countersStarted = true;

    if (this.prefersReduced) {
      this.displayCounters = this.counters.map(c => c.value);
      this.cdr.detectChanges();
      return;
    }

    const duration = 1800;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      this.displayCounters = this.counters.map(c => Math.round(c.value * eased));
      this.cdr.detectChanges();

      if (progress < 1) this.counterRaf = requestAnimationFrame(step);
    };

    this.counterRaf = requestAnimationFrame(step);
  }

  private initStatsObserver(): void {
    const el = this.statsSection?.nativeElement;
    if (!el || typeof IntersectionObserver === 'undefined') {
      this.ngZone.run(() => this.startCounters());
      return;
    }

    this.statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          this.ngZone.run(() => this.startCounters());
          this.statsObserver?.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    this.statsObserver.observe(el);
  }

  /* =========================
     CARD TILT
  ========================= */

  onCardMove(event: MouseEvent): void {
    if (this.prefersReduced) return;

    const card = event.currentTarget as HTMLElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.transform =
      `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  }

  onCardLeave(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    if (!card) return;
    card.style.transform = '';
  }

  /* =========================
     MODAL
  ========================= */

  openDev(dev: Developer): void {
    this.lastFocused = document.activeElement as HTMLElement;
    this.selectedDev = dev;
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      (document.querySelector('.profile-dialog .modal-close') as HTMLElement | null)?.focus();
    }, 60);
  }

  closeDev(): void {
    this.selectedDev = null;
    document.body.style.overflow = '';
    this.lastFocused?.focus?.();
    this.lastFocused = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedDev) this.closeDev();
  }

  /* =========================
     CTA — نسخ الإيميل
  ========================= */

  async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.contactEmail);
    } catch {
      /* لو الـ clipboard مش متاح هنكتفي بالإشعار */
    }

    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 2200);
  }

  /* =========================
     HERO — crosshair بيتحرك مع الماوس
  ========================= */

  private initHeroTracking(): void {
    const heroEl = this.hero?.nativeElement;
    if (!heroEl) return;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || this.prefersReduced) return;

    this.heroMoveHandler = (e: MouseEvent) => {
      const rect = heroEl.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      this.mouse.x = x;
      this.mouse.y = y;

      heroEl.classList.add('tracking');

      if (this.crossV) this.crossV.nativeElement.style.transform = `translateX(${x}px)`;
      if (this.crossH) this.crossH.nativeElement.style.transform = `translateY(${y}px)`;
      if (this.crossRead) {
        const read = this.crossRead.nativeElement;
        read.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
        read.textContent = `x:${x}  y:${y}`;
      }
    };

    this.heroLeaveHandler = () => {
      heroEl.classList.remove('tracking');
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    };

    heroEl.addEventListener('mousemove', this.heroMoveHandler);
    heroEl.addEventListener('mouseleave', this.heroLeaveHandler);
  }

  /* =========================
     PARTICLES (بتتفاعل مع الماوس)
  ========================= */

  private initParticles(): void {
    const canvas = this.particlesCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const particles: Particle[] = [];
    const count = window.innerWidth < 768 ? 32 : 70;
    const colors = ['#8fb0ff', '#ffffff', '#ffc61a'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const o = particles[j];
          const d = Math.hypot(p.x - o.x, p.y - o.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = '#8fb0ff';
            ctx.globalAlpha = (1 - d / 110) * 0.16;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        const md = Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y);
        if (md < 170) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.strokeStyle = '#ffc61a';
          ctx.globalAlpha = (1 - md / 170) * 0.5;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (this.heroVisible) draw();
      this.particlesRaf = requestAnimationFrame(loop);
    };

    if (this.prefersReduced) {
      draw();
    } else {
      loop();
    }

    if (typeof IntersectionObserver !== 'undefined' && this.hero) {
      this.heroObserver = new IntersectionObserver(
        (entries) => { this.heroVisible = entries[0].isIntersecting; },
        { threshold: 0 }
      );
      this.heroObserver.observe(this.hero.nativeElement);
    }

    this.resizeHandler = () => resize();
    window.addEventListener('resize', this.resizeHandler);
  }

  /* =========================
     SCROLL PROGRESS
  ========================= */

  private initScrollProgress(): void {
    const bar = this.progress?.nativeElement;
    if (!bar) return;

    this.scrollHandler = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = `scaleX(${ratio})`;
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.scrollHandler();
  }

  /* =========================
     SCROLL REVEAL
  ========================= */

  private initScrollReveal(): void {
    const items = document.querySelectorAll('.reveal');

    if (typeof IntersectionObserver === 'undefined' || this.prefersReduced) {
      items.forEach(el => el.classList.add('revealed'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach(el => this.revealObserver?.observe(el));
  }
}