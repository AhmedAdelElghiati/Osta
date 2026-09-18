import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  postedAt: string;
  daysOpen: number;
  offers: number;
  urgent: boolean;
  tags: string[];
  images?: string[];
  imagesCount: number;
}

@Component({
  selector: 'app-jobs-market',
  imports: [FormsModule, DecimalPipe],
  styleUrl: './jobs-market.css',
  templateUrl: './jobs-market.html',
})
export class JobsMarket {

  activeTab = signal('all');

  tabs = [
    { key: 'all',    label: 'كل الشغلات',                 count: 154 },
    { key: 'urgent', label: 'شغلات مستعجلة وجائزة إنجاز', count: 14 },
    { key: 'big',    label: 'تشطيبات وديكورات كبيرة',     count: 32 },
  ];

  selectedCategory = signal('all');
  selectedLocation = signal('all');
  selectedBudget = signal('all');
  sortBy = signal('newest');

  // عدد الشغلانات في الصفحة الواحدة
  pageSize = 5;

  // الصفحة الحالية
  currentPage = signal(1);


  jobs: Job[] = [

    {
      id: 1,
      title: 'تحديد وتشطيب مطبخ أرو أمريكي خشب زان محمل',
      description: 'مطلوب نجار محترف وشاطر لتكملة وتعديل دولاب مطبخ أرو مقاس 3.8 متر طولي مع إضافة رفوف، ومفيش مشاكل هيدروليك. اليوم بإذن الله سيتم توفير جزء منها وباقي الأكسسوارات على الفني بالاتفاق بعد المعاينة.',
      category: 'نجارة',
      location: 'المعادي - القاهرة',
      budgetMin: 8000,
      budgetMax: 12000,
      postedAt: 'منذ 3 ساعات',
      daysOpen: 2,
      offers: 7,
      urgent: false,
      tags: ['نجارة', 'مطبخ'],
      images: [
        'job-100.jpg',
        'job-200.jpg',
        'job-300.jpg',
      ],
      imagesCount: 3,
    },

    {
      id: 2,
      title: 'تأسيس شبكة كهرباء وإضاءات لشقة 140م قبل المحارة',
      description: 'الشقة على المحارة، 3 غرف وريسيبشن قطعتين. الأعمال تشمل تكسير ومواسير توزيع ولوحة 24 خط وسحب أسلاك أولية للإضاءة وتسليم المسارات بالكامل.',
      category: 'كهرباء',
      location: 'التجمع الخامس - القاهرة',
      budgetMin: 15000,
      budgetMax: 15000,
      postedAt: 'منذ 5 ساعات',
      daysOpen: 1,
      offers: 7,
      urgent: false,
      tags: ['كهرباء', 'إضاءة'],
      imagesCount: 0,
    },

    {
      id: 3,
      title: 'تركيب وصيانة تكييف سبليت 2.25 حصان',
      description: 'مطلوب فني تكييف لتركيب تكييف سبليت جديد مع مراجعة المواسير والكهرباء وتجربة الجهاز بعد التركيب والتأكد من عدم وجود أي تسريب.',
      category: 'تكييف',
      location: 'مدينة نصر - القاهرة',
      budgetMin: 1000,
      budgetMax: 1800,
      postedAt: 'منذ ساعة',
      daysOpen: 3,
      offers: 4,
      urgent: true,
      tags: ['تكييف', 'صيانة'],
      images: [
        'job-100.jpg',
        'job-200.jpg',
        'job-300.jpg',
      ],
      imagesCount: 2,
    },

    {
      id: 4,
      title: 'سباكة حمام ومطبخ بالكامل لشقة جديدة',
      description: 'مطلوب سباك لتنفيذ أعمال تأسيس وتركيب السباكة للحمام والمطبخ، مع اختبار المواسير والتأكد من عدم وجود أي تسريب قبل التشطيب.',
      category: 'سباكة',
      location: '6 أكتوبر - الجيزة',
      budgetMin: 3500,
      budgetMax: 5500,
      postedAt: 'منذ 4 ساعات',
      daysOpen: 2,
      offers: 5,
      urgent: false,
      tags: ['سباكة', 'تأسيس'],
      imagesCount: 0,
    },

    {
      id: 5,
      title: 'دهانات وتشطيب شقة 180 متر بالكامل',
      description: 'مطلوب نقاش محترف لتشطيب شقة 180 متر، شامل تجهيز الحوائط والمعجون والصنفرة والوجه النهائي مع الالتزام بمواعيد التسليم.',
      category: 'نقاشة',
      location: 'الشيخ زايد - الجيزة',
      budgetMin: 9000,
      budgetMax: 14000,
      postedAt: 'منذ 7 ساعات',
      daysOpen: 4,
      offers: 9,
      urgent: false,
      tags: ['نقاشة', 'تشطيب'],
      images: [
        
        'job-100.jpg',
        'job-200.jpg',
        'job-300.jpg',
      ],
      imagesCount: 6,
    },

    {
      id: 6,
      title: 'تركيب أبواب خشب داخلية لفيلا',
      description: 'مطلوب نجار لتركيب 8 أبواب خشب داخلية في فيلا، مع ضبط المفصلات والأقفال والتأكد من جودة التركيب والتشطيب النهائي.',
      category: 'نجارة',
      location: 'التجمع الأول - القاهرة',
      budgetMin: 6000,
      budgetMax: 8500,
      postedAt: 'منذ يوم',
      daysOpen: 5,
      offers: 6,
      urgent: false,
      tags: ['نجارة', 'أبواب'],
      images: [
        'job-100.jpg',
      ],
      imagesCount: 1,
    },

    {
      id: 7,
      title: 'إصلاح عطل كهرباء عاجل في شقة',
      description: 'مطلوب كهربائي بشكل عاجل لفحص عطل في الكهرباء داخل شقة ومعرفة سبب فصل التيار عن بعض الغرف وإصلاح المشكلة بشكل آمن.',
      category: 'كهرباء',
      location: 'المهندسين - الجيزة',
      budgetMin: 500,
      budgetMax: 1200,
      postedAt: 'منذ 30 دقيقة',
      daysOpen: 1,
      offers: 3,
      urgent: true,
      tags: ['كهرباء', 'عاجل'],
      imagesCount: 0,
    },

    {
      id: 8,
      title: 'تشطيب ديكورات جبس بورد وريسبشن كبير',
      description: 'مطلوب فني جبس بورد لتنفيذ تصميم ريسبشن كبير شامل الأسقف المعلقة والبيت النور وبعض التفاصيل الديكورية حسب التصميم المتفق عليه.',
      category: 'تشطيبات',
      location: 'التجمع الخامس - القاهرة',
      budgetMin: 18000,
      budgetMax: 28000,
      postedAt: 'منذ يومين',
      daysOpen: 6,
      offers: 8,
      urgent: false,
      tags: ['جبس بورد', 'ديكور'],
      images: [
  
        'job-100.jpg',
        'job-200.jpg',
        'job-300.jpg',
      ],
      imagesCount: 3,
    },

    {
      id: 9,
      title: 'صيانة سخان غاز وفحص دائرة المياه',
      description: 'مطلوب فني صيانة سخانات لفحص سخان غاز لا يعمل بشكل منتظم ومعرفة سبب المشكلة وتنفيذ الإصلاح بعد المعاينة.',
      category: 'سباكة',
      location: 'الدقي - الجيزة',
      budgetMin: 400,
      budgetMax: 900,
      postedAt: 'منذ ساعتين',
      daysOpen: 2,
      offers: 4,
      urgent: true,
      tags: ['سباكة', 'صيانة'],
      imagesCount: 0,
    },

    {
      id: 10,
      title: 'تركيب أرضيات باركيه لغرفتين وريسبشن',
      description: 'مطلوب فني تركيب أرضيات باركيه لتنفيذ الأرضيات في غرفتين وريسبشن مع تجهيز الأرضية وضبط الفواصل والتشطيب النهائي.',
      category: 'تشطيبات',
      location: 'المقطم - القاهرة',
      budgetMin: 7000,
      budgetMax: 11000,
      postedAt: 'منذ 6 ساعات',
      daysOpen: 3,
      offers: 5,
      urgent: false,
      tags: ['باركيه', 'تشطيبات'],
      images: [
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
      ],
      imagesCount: 2,
    },

    {
      id: 11,
      title: 'تغيير وتركيب نجف وإضاءات ديكورية',
      description: 'مطلوب كهربائي لتركيب مجموعة نجف وإضاءات ديكورية في شقة جديدة، مع تنظيم الأسلاك وتجربة جميع نقاط الإضاءة.',
      category: 'كهرباء',
      location: 'العجوزة - الجيزة',
      budgetMin: 1500,
      budgetMax: 3000,
      postedAt: 'منذ 8 ساعات',
      daysOpen: 2,
      offers: 6,
      urgent: false,
      tags: ['كهرباء', 'نجف'],
      imagesCount: 0,
    },

    {
      id: 12,
      title: 'تشطيب واجهة فيلا ودهانات خارجية',
      description: 'مطلوب مقاول تشطيبات لتنفيذ دهانات واجهة فيلا مع تجهيز السطح ومعالجة أي شروخ وتنفيذ الدهان الخارجي بجودة عالية.',
      category: 'تشطيبات',
      location: 'العين السخنة - السويس',
      budgetMin: 20000,
      budgetMax: 35000,
      postedAt: 'منذ 3 أيام',
      daysOpen: 7,
      offers: 11,
      urgent: false,
      tags: ['تشطيبات', 'واجهات'],
      images: [
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
      ],
      imagesCount: 3,
    },

    {
      id: 13,
      title: 'تركيب شبابيك وأبواب ألوميتال لشقة',
      description: 'مطلوب فني ألوميتال لتركيب شبابيك وأبواب للشقة مع ضبط المقاسات والتأكد من جودة الغلق والتشطيب النهائي.',
      category: 'ألوميتال',
      location: 'حلوان - القاهرة',
      budgetMin: 5000,
      budgetMax: 8000,
      postedAt: 'منذ 4 ساعات',
      daysOpen: 3,
      offers: 4,
      urgent: false,
      tags: ['ألوميتال', 'تركيب'],
      imagesCount: 0,
    },

    {
      id: 14,
      title: 'تركيب سيراميك حمامات ومطبخ',
      description: 'مطلوب فني سيراميك محترف لتركيب سيراميك الحمامات والمطبخ مع ضبط الميول والفواصل والتشطيب النهائي.',
      category: 'سيراميك',
      location: 'مدينة نصر - القاهرة',
      budgetMin: 6500,
      budgetMax: 10000,
      postedAt: 'منذ يوم',
      daysOpen: 4,
      offers: 7,
      urgent: false,
      tags: ['سيراميك', 'تشطيب'],
      images: [
        'https://via.placeholder.com/200x120',
        'https://via.placeholder.com/200x120',
      ],
      imagesCount: 2,
    },

    {
      id: 15,
      title: 'صيانة موتور مياه وتركيب عوامة جديدة',
      description: 'مطلوب فني سباكة لفحص موتور المياه وتركيب عوامة جديدة وضبط ضغط المياه والتأكد من التشغيل بشكل طبيعي.',
      category: 'سباكة',
      location: 'شبرا - القاهرة',
      budgetMin: 700,
      budgetMax: 1500,
      postedAt: 'منذ ساعتين',
      daysOpen: 2,
      offers: 3,
      urgent: true,
      tags: ['سباكة', 'صيانة'],
      imagesCount: 0,
    },
  ];


  // الشغلانات بعد التاب والترتيب
  filteredJobs = computed(() => {

    const tab = this.activeTab();

    let list = this.jobs.filter(j => {

      if (tab === 'urgent' && !j.urgent) {
        return false;
      }

      if (tab === 'big' && j.budgetMax < 5000) {
        return false;
      }

      return true;
    });


    // الترتيب حسب الميزانية
    if (this.sortBy() === 'budget') {
      list = [...list].sort(
        (a, b) => b.budgetMax - a.budgetMax
      );
    }

    return list;
  });


  // إجمالي عدد الصفحات
  totalPages = computed(() => {
    return Math.ceil(
      this.filteredJobs().length / this.pageSize
    );
  });


  // أرقام الصفحات
  pages = computed(() => {
    return Array.from(
      { length: this.totalPages() },
      (_, i) => i + 1
    );
  });


  // الشغلانات اللي هتظهر في الصفحة الحالية فقط
  paginatedJobs = computed(() => {

    const start =
      (this.currentPage() - 1) * this.pageSize;

    const end =
      start + this.pageSize;

    return this.filteredJobs().slice(start, end);
  });


  setTab(key: string) {

    this.activeTab.set(key);

    // نرجع لأول صفحة
    this.currentPage.set(1);
  }


  applyFilters() {

    console.log('Applied:', {
      category: this.selectedCategory(),
      location: this.selectedLocation(),
      budget: this.selectedBudget(),
      sortBy: this.sortBy(),
    });

    // بعد الفلترة نرجع لأول صفحة
    this.currentPage.set(1);
  }


  // الانتقال لصفحة معينة
  goToPage(page: number) {

    if (
      page >= 1 &&
      page <= this.totalPages()
    ) {
      this.currentPage.set(page);

      // يرجع لأول القائمة
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }


  // الصفحة السابقة
  previousPage() {

    if (this.currentPage() > 1) {
      this.goToPage(
        this.currentPage() - 1
      );
    }
  }


  // الصفحة التالية
  nextPage() {

    if (
      this.currentPage() < this.totalPages()
    ) {
      this.goToPage(
        this.currentPage() + 1
      );
    }
  }
}