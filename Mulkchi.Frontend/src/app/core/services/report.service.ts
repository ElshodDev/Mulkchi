import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportDto {
  id: string;
  propertyId: string;
  reporterId?: string | null;
  message: string;
  status: string;
  createdDate: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;
  private readonly http = inject(HttpClient);

  getReports(page = 1, pageSize = 20): Observable<{ items: ReportDto[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<{ items: ReportDto[]; total: number }>(this.apiUrl, { params }).pipe(
      catchError((err) => {
        console.error('Error loading reports', err);
        return throwError(() => err);
      }),
    );
  }

  updateReportStatus(id: string, status: string) {
    return this.http.patch<{ id: string }>(`${this.apiUrl}/${id}/status`, `"${status}"`, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError((err) => {
        console.error('Error updating report status', err);
        return throwError(() => err);
      }),
    );
  }

  createReport(payload: ReportCreateRequest): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
}

export interface ReportCreateRequest {
  propertyId: string;
  message: string;
}
