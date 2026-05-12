import { HttpClient, HttpParams } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Announcement,
  AnnouncementDisplay,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from '../models/announcement.model';
import { PagedResult } from '../models/common.model';
import { UIStore } from '../stores/ui.store';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private readonly apiUrl = `${environment.apiUrl}/announcements`;
  private readonly http = inject(HttpClient);
  private readonly uiStore = inject(UIStore);

  // Signals for state management
  private readonly _rawAnnouncements = signal<Announcement[]>([]);
  private readonly _announcements = signal<AnnouncementDisplay[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly announcements = this._announcements.asReadonly();
  readonly loading = () => this._loading();
  readonly error = () => this._error();

  constructor() {
    effect(() => {
      const language = this.uiStore.language();
      const rawAnnouncements = this._rawAnnouncements();
      this._announcements.set(
        rawAnnouncements.map((announcement) => this.mapToDisplayModel(announcement, language)),
      );
    });

    this.loadAnnouncements();
  }

  /**
   * Barcha faol e'lonlarni yuklash (paginated)
   */
  getAnnouncements(page: number = 1, pageSize: number = 10): Observable<PagedResult<Announcement>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<Announcement>>(this.apiUrl, { params }).pipe(
      tap((result) => {
        this._rawAnnouncements.set(result.items);
        this._error.set(null);
      }),
      catchError((error) => {
        this._error.set("E'lonlarni yuklashda xato");
        console.error('Error loading announcements:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * ID bo'yicha aniq e'lon olish
   */
  getAnnouncementById(id: string): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        this._error.set("E'lonni yuklashda xato");
        console.error('Error loading announcement:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Yangi e'lon yaratish (faqat Admin)
   */
  createAnnouncement(announcement: CreateAnnouncementRequest): Observable<Announcement> {
    this._loading.set(true);
    return this.http.post<Announcement>(this.apiUrl, announcement).pipe(
      tap(() => {
        this._error.set(null);
        this.loadAnnouncements();
      }),
      catchError((error) => {
        this._error.set("E'lonni yaratishda xato");
        console.error('Error creating announcement:', error);
        return throwError(() => error);
      }),
      tap(() => this._loading.set(false)),
    );
  }

  /**
   * E'lonni yangilash (faqat Admin)
   */
  updateAnnouncement(
    id: string,
    announcement: UpdateAnnouncementRequest,
  ): Observable<Announcement> {
    this._loading.set(true);
    return this.http.put<Announcement>(`${this.apiUrl}/${id}`, announcement).pipe(
      tap(() => {
        this._error.set(null);
        this.loadAnnouncements();
      }),
      catchError((error) => {
        this._error.set("E'lonni yangilashda xato");
        console.error('Error updating announcement:', error);
        return throwError(() => error);
      }),
      tap(() => this._loading.set(false)),
    );
  }

  /**
   * E'lonni o'chirish (faqat Admin)
   */
  deleteAnnouncement(id: string): Observable<void> {
    this._loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._error.set(null);
        this.loadAnnouncements();
      }),
      catchError((error) => {
        this._error.set("E'lonni o'chirishda xato");
        console.error('Error deleting announcement:', error);
        return throwError(() => error);
      }),
      tap(() => this._loading.set(false)),
    );
  }

  /**
   * Foydaxonangning til tilida e'lonni olish
   */
  private mapToDisplayModel(announcement: Announcement, language: string): AnnouncementDisplay {
    let title = announcement.titleUz;
    let content = announcement.contentUz;

    if (language === 'ru') {
      title = announcement.titleRu;
      content = announcement.contentRu;
    } else if (language === 'en') {
      title = announcement.titleEn;
      content = announcement.contentEn;
    }

    const expiresAt = announcement.expiresAt ? new Date(announcement.expiresAt) : undefined;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    return {
      id: announcement.id,
      title,
      content,
      type: announcement.type,
      target: announcement.target,
      publishedAt: announcement.publishedAt,
      expiresAt,
      isExpired,
    };
  }

  /**
   * E'lonlarni avvaldan yuklash
   */
  private loadAnnouncements(): void {
    this._loading.set(true);
    this.getAnnouncements(1, 100).subscribe();
  }
}
