import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, forkJoin, map } from 'rxjs';
import type { Socket } from 'socket.io-client';
import { API_ORIGIN, API_BASE_URL, JOBS_ENDPOINT } from '../core/api.config';
import { Auth } from './auth';

export interface ChatParticipant {
  _id: string;
  name: string;
  role: 'customer' | 'artisan';
  profileImage?: string;
}

export interface ChatJob {
  _id: string;
  status: string;
  customerId: ChatParticipant;
  artisanId: ChatParticipant;
  requestId: { title: string };
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  me: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'offline';

@Injectable({ providedIn: 'root' })
export class Chat {
  private readonly endpoint = `${API_BASE_URL}/v1/chat`;
  private socket: Socket | null = null;
  private socketToken = '';
  private activeJobId = '';
  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('offline');
  private readonly socketErrorSubject = new Subject<string>();
  private readonly joinedSubject = new Subject<string>();

  readonly messages$ = this.messageSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();
  readonly socketErrors$ = this.socketErrorSubject.asObservable();
  readonly joined$ = this.joinedSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: Auth,
  ) {
    this.auth.currentUser$.subscribe((user) => {
      if (!user) this.closeConversation();
      else if (this.activeJobId && this.socketToken !== this.auth.getAccessToken()) {
        this.openConversation(this.activeJobId);
      }
    });
  }

  listJobs(): Observable<ChatJob[]> {
    return forkJoin([
      this.http.get<any>(`${JOBS_ENDPOINT}/me`, { withCredentials: true }),
      this.http.get<any>(`${this.endpoint}/direct`, { withCredentials: true }),
    ]).pipe(map(([jobs, direct]) => [...(direct.data || []), ...(jobs.data?.items || [])]));
  }

  startDirect(artisanId: string): Observable<string> {
    return this.http.post<any>(`${this.endpoint}/direct`, { artisanId }, { withCredentials: true })
      .pipe(map(response => response.data.id));
  }

  loadMessages(jobId: string): Observable<ChatMessage[]> {
    return this.http.get<any>(`${this.endpoint}/jobs/${jobId}/messages`, { withCredentials: true }).pipe(
      map((response) => (response?.data ?? []).map((message: any) => this.mapMessage(message))),
    );
  }

  sendMessage(jobId: string, text: string): Observable<ChatMessage> {
    return this.http
      .post<any>(
        `${this.endpoint}/jobs/${jobId}/messages`,
        { text },
        { withCredentials: true },
      )
      .pipe(map((response) => this.mapMessage(response.data)));
  }

  openConversation(jobId: string): void {
    if (this.activeJobId && this.activeJobId !== jobId && this.socket?.connected) {
      this.socket.emit('chat:leave', this.activeJobId);
    }
    this.activeJobId = jobId;

    const token = this.auth.getAccessToken();
    if (!token) {
      this.connectionStatusSubject.next('offline');
      return;
    }

    if (!this.socket || this.socketToken !== token) {
      this.socket?.disconnect();
      this.socket = null;
      this.socketToken = token;
      this.connectionStatusSubject.next('connecting');
      void this.createSocket(token);
    } else if (this.socket.connected) {
      this.connectionStatusSubject.next('connecting');
      this.joinActiveConversation();
    }
  }

  closeConversation(): void {
    if (this.activeJobId && this.socket?.connected) {
      this.socket.emit('chat:leave', this.activeJobId);
    }
    this.activeJobId = '';
    this.socket?.disconnect();
    this.socket = null;
    this.socketToken = '';
    this.connectionStatusSubject.next('offline');
  }

  private async createSocket(token: string): Promise<void> {
    try {
      const { io } = await import('socket.io-client');
      if (this.socket || this.socketToken !== token || !this.activeJobId) return;

      this.socket = io(API_ORIGIN, { auth: { token }, withCredentials: true });
      this.socket.on('connect', () => {
        this.connectionStatusSubject.next('connecting');
        this.joinActiveConversation();
      });
      this.socket.on('chat:joined', ({ jobId }: { jobId: string }) => {
        if (jobId !== this.activeJobId) return;
        this.connectionStatusSubject.next('connected');
        this.joinedSubject.next(jobId);
      });
      this.socket.on('disconnect', () => this.connectionStatusSubject.next('offline'));
      this.socket.on('connect_error', () => this.connectionStatusSubject.next('offline'));
      this.socket.on('chat:message', (message: any) => {
        if ((message.conversationId ? 'direct:' + message.conversationId : String(message.jobId)) === this.activeJobId) {
          this.messageSubject.next(this.mapMessage(message));
        }
      });
      this.socket.on('chat:error', (error: { message?: string }) => {
        this.connectionStatusSubject.next('offline');
        this.socketErrorSubject.next(error.message || 'تعذر الاتصال بالمحادثة المباشرة.');
      });
    } catch (_error) {
      if (this.socketToken === token) {
        this.connectionStatusSubject.next('offline');
        this.socketErrorSubject.next('تعذر تحميل خدمة المحادثة المباشرة.');
      }
    }
  }

  private joinActiveConversation(): void {
    if (this.activeJobId) this.socket?.emit('chat:join', this.activeJobId);
  }

  private mapMessage(raw: any): ChatMessage {
    const sender = raw.senderId;
    const senderId = String(typeof sender === 'object' ? sender?._id : sender);
    return {
      id: String(raw._id ?? raw.id),
      jobId: raw.conversationId ? 'direct:' + raw.conversationId : String(raw.jobId),
      senderId,
      senderName: typeof sender === 'object' ? sender?.name || '' : '',
      text: raw.text,
      createdAt: raw.createdAt,
      me: senderId === this.auth.currentUserValue?.id,
    };
  }
}
