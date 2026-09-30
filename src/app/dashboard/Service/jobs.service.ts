import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { WalletService } from './wallet.service';

export type JobPhase = 'معاينة' | 'تنفيذ' | 'انتظار' | 'مكتمل';

export interface ChatMessage {
  me: boolean;
  text: string;
  time: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  area: string;
  phase: JobPhase;
  price: number;
  escrow: number;
  note: string;
  inv?: string;
  chat: ChatMessage[];
}

@Injectable({ providedIn: 'root' })
export class JobsService {

  private wallet = inject(WalletService);

  private invSeq = 1030;
  private jobSeq = 2451;

  /** بيطلع لما العميل يعتمد التسليم */
  approved$ = new Subject<{ job: Job; net: number; fee: number }>();

  jobs: Job[] = [
    {
      id: 'J-2450',
      title: 'تركيب سخانات شقة كاملة',
      client: 'أ. منى عبد الحميد',
      area: 'طنطا — شارع البحر',
      phase: 'معاينة',
      price: 1850,
      escrow: 1850,
      note: 'موعد المعاينة: غداً 11:00 ص — العميلة أكدت الموعد',
      chat: [
        { me: false, text: 'أهلاً أستاذ إبراهيم، متاحة بكرة 11 الصبح للمعاينة. العنوان شارع البحر عمارة 21.', time: '9:40 ص' }
      ]
    },
    {
      id: 'J-2411',
      title: 'صيانة سباكة ومحابس الحمام',
      client: 'أ. أحمد عثمان',
      area: 'طنطا',
      phase: 'تنفيذ',
      price: 1400,
      escrow: 1400,
      note: 'بدأ التنفيذ — متوقع الانتهاء خلال يومين',
      chat: [
        { me: false, text: 'أهلاً أستاذ أحمد، بدأت الشغل الصبح وفكيت المحابس القديمة.', time: '10:12 ص' },
        { me: true, text: 'تمام يا أستاذ إبراهيم. لو لقيت الخراطيم محتاجة تغيير قولّي قبل ما تشتري.', time: '10:20 ص' },
        { me: false, text: 'إن شاء الله، الخراطيم حالتها كويسة. هرجع أحدثك بعد الضهر.', time: '10:25 ص' }
      ]
    },
    {
      id: 'J-2388',
      title: 'تأسيس شبكة مياه — فيلا التجمع',
      client: 'م. شريف فهمي',
      area: 'طنطا',
      phase: 'مكتمل',
      price: 8400,
      escrow: 0,
      inv: 'INV-0998',
      note: 'تم الاعتماد والصرف',
      chat: []
    },
    {
      id: 'J-2370',
      title: 'إصلاح تسريب بمطبخ مدينة نصر',
      client: 'أ. ياسمين رأفت',
      area: 'طنطا',
      phase: 'مكتمل',
      price: 1150,
      escrow: 0,
      inv: 'INV-0971',
      note: 'تم الاعتماد والصرف',
      chat: []
    }
  ];

  get activeJobs() {
    return this.jobs.filter(j => j.phase !== 'مكتمل');
  }

  get completedJobs() {
    return this.jobs.filter(j => j.phase === 'مكتمل');
  }

  private find(id: string) {
    return this.jobs.find(j => j.id === id);
  }

  /** بيعمل شغلانة جديدة من عرض اتقبل — المبلغ بيتحجز في الضمان */
  addFromOffer(o: { title: string; client: string; area: string; price: number }): Job {
    const job: Job = {
      id: 'J-' + this.jobSeq++,
      title: o.title,
      client: o.client,
      area: o.area,
      phase: 'معاينة',
      price: o.price,
      escrow: o.price,
      note: 'موعد المعاينة: غداً 11:00 ص — بانتظار تأكيد العميل',
      chat: [
        {
          me: false,
          text: `أهلاً أستاذ إبراهيم 👋 قبلت عرضك على «${o.title}». متفقين على معاينة بكرة 11 الصبح؟`,
          time: this.nowTime()
        }
      ]
    };

    this.jobs.unshift(job);
    this.wallet.reserveEscrow(o.title, o.price);
    return job;
  }

  startExecution(id: string) {
    const job = this.find(id);
    if (!job) return;

    job.phase = 'تنفيذ';
    job.note = 'بدأ التنفيذ — بعد انتهاء الشغل اضغط «إنهاء التنفيذ»';
    job.chat.push({
      me: false,
      text: 'تمام يا أستاذ إبراهيم، ابدأ براحتك وأنا واثق فيك 👍',
      time: this.nowTime()
    });
  }

  finishJob(id: string) {
    const job = this.find(id);
    if (!job) return;

    job.phase = 'انتظار';
    job.note = 'تم إنهاء التنفيذ — العميل بيراجع الشغل للاعتماد';
    job.chat.push({
      me: true,
      text: 'خلصت الشغل كامل يا فندم. تقدر تراجعه وتعتمد التسليم من لوحتك، ولو فيه أي ملاحظة أنا موجود.',
      time: this.nowTime()
    });

    // محاكاة اعتماد العميل بعد 10 ثواني
    setTimeout(() => this.clientApproves(id), 10000);
  }

  private clientApproves(id: string) {
    const job = this.find(id);
    if (!job || job.phase !== 'انتظار') return;

    job.inv = 'INV-' + this.invSeq++;

    const { net, fee } = this.wallet.release(job.title, job.price, job.inv);

    job.phase = 'مكتمل';
    job.escrow = 0;
    job.note = 'تم الاعتماد والصرف';

    this.approved$.next({ job, net, fee });
  }

  addMessage(id: string, message: ChatMessage) {
    this.find(id)?.chat.push(message);
  }

  nowTime() {
    return new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  }
}