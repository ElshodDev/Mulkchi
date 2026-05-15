import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Announcement, CreateAnnouncementRequest } from '../../../core/models';
import {
  AnnouncementService,
  AuthService,
  ConfirmationService,
  ToastService,
} from '../../../core/services';

@Component({
  selector: 'app-announcements-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="announcements-management-container">
      <div class="container">
        <div class="page-header">
          <h1>E'lonlarni boshqarish</h1>
          <p>Tizim e'lonlarini yaratish, tahrirlash va o'chirish</p>
        </div>

        <!-- Form Section -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{
              editingId() ? "E'lonni tahrirlash" : "Yangi e'lon yaratish"
            }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="announcementForm" (ngSubmit)="saveAnnouncement()">
              <div class="form-grid">
                <!-- Titles -->
                <mat-form-field class="full-width">
                  <mat-label>Sarlavha (Uzbek)</mat-label>
                  <input matInput formControlName="TitleUz" required />
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Sarlavha (Rus)</mat-label>
                  <input matInput formControlName="TitleRu" required />
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Sarlavha (English)</mat-label>
                  <input matInput formControlName="TitleEn" required />
                </mat-form-field>

                <!-- Content -->
                <mat-form-field class="full-width">
                  <mat-label>Matn (Uzbek)</mat-label>
                  <textarea matInput formControlName="ContentUz" required rows="3"></textarea>
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Matn (Rus)</mat-label>
                  <textarea matInput formControlName="ContentRu" required rows="3"></textarea>
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Matn (English)</mat-label>
                  <textarea matInput formControlName="ContentEn" required rows="3"></textarea>
                </mat-form-field>

                <!-- Type and Target -->
                <mat-form-field>
                  <mat-label>Turi</mat-label>
                  <mat-select formControlName="Type" required>
                    <mat-option value="General">Umumiy</mat-option>
                    <mat-option value="Maintenance">Texnik ishlar</mat-option>
                    <mat-option value="Promotion">Aksiya</mat-option>
                    <mat-option value="PolicyUpdate">Siyosat o'zgarishi</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>Maqsad</mat-label>
                  <mat-select formControlName="Target" required>
                    <mat-option value="AllUsers">Barcha foydalanuvchilar</mat-option>
                    <mat-option value="Hosts">Uy egalari</mat-option>
                    <mat-option value="Guests">Mehmonlar</mat-option>
                    <mat-option value="Admins">Adminlar</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Dates -->
                <mat-form-field>
                  <mat-label>Nashr qilish sanasi</mat-label>
                  <input matInput [matDatepicker]="publishPicker" formControlName="PublishedAt" />
                  <mat-datepicker-toggle matSuffix [for]="publishPicker"></mat-datepicker-toggle>
                  <mat-datepicker #publishPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>Amal qilish muddati</mat-label>
                  <input matInput [matDatepicker]="expirePicker" formControlName="ExpiresAt" />
                  <mat-datepicker-toggle matSuffix [for]="expirePicker"></mat-datepicker-toggle>
                  <mat-datepicker #expirePicker></mat-datepicker>
                </mat-form-field>

                <!-- Active Toggle -->
                <div class="toggle-group">
                  <mat-slide-toggle formControlName="IsActive" color="primary">
                    Faol
                  </mat-slide-toggle>
                </div>
              </div>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  [disabled]="!announcementForm.valid || loading()"
                >
                  <mat-icon>{{ editingId() ? 'edit' : 'add' }}</mat-icon>
                  {{ editingId() ? 'Yangilash' : 'Yaratish' }}
                </button>
                <button
                  mat-stroked-button
                  type="button"
                  (click)="resetForm()"
                  [disabled]="loading()"
                >
                  <mat-icon>clear</mat-icon>
                  Tozalash
                </button>
                <button
                  *ngIf="editingId()"
                  mat-stroked-button
                  type="button"
                  (click)="cancelEdit()"
                  [disabled]="loading()"
                >
                  <mat-icon>cancel</mat-icon>
                  Bekor qilish
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Table Section -->
        <mat-card class="table-card" *ngIf="announcements.length > 0" #announcementsTable>
          <mat-card-header>
            <mat-card-title>E'lonlar ro'yxati</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading()" class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>

            <div class="table-wrapper" *ngIf="!loading()">
              <table mat-table [dataSource]="announcements" class="announcements-table">
                <!-- Sarlavha Column -->
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Sarlavha</th>
                  <td mat-cell *matCellDef="let element">
                    <strong>{{ element.titleUz }}</strong>
                  </td>
                </ng-container>

                <!-- Turi Column -->
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Turi</th>
                  <td mat-cell *matCellDef="let element">
                    <span [class]="'badge badge-' + element.type">
                      {{ getTypeLabel(element.type) }}
                    </span>
                  </td>
                </ng-container>

                <!-- Maqsad Column -->
                <ng-container matColumnDef="target">
                  <th mat-header-cell *matHeaderCellDef>Maqsad</th>
                  <td mat-cell *matCellDef="let element">
                    {{ getTargetLabel(element.target) }}
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let element">
                    <span [class]="element.isActive ? 'status-active' : 'status-inactive'">
                      {{ element.isActive ? 'Faol' : 'Nofaol' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Amallar Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Amallar</th>
                  <td mat-cell *matCellDef="let element">
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="editAnnouncement(element)"
                      title="Tahrirlash"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteAnnouncement(element.id)"
                      title="O'chirish"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Empty State -->
        <mat-card class="empty-state" *ngIf="announcements.length === 0 && !loading()">
          <div class="empty-content">
            <mat-icon>info</mat-icon>
            <p>Hozircha e'lonlar mavjud emas</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .announcements-management-container {
        padding: 20px;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 30px;
      }

      .page-header h1 {
        margin: 0;
        font-size: 32px;
        color: #333;
      }

      .page-header p {
        margin: 5px 0 0 0;
        color: #999;
      }

      .form-card,
      .table-card {
        margin-bottom: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      mat-form-field {
        width: 100%;
      }

      textarea {
        resize: vertical;
      }

      .toggle-group {
        grid-column: 1 / -1;
        padding: 10px 0;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }

      .form-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .announcements-table {
        width: 100%;
        margin-top: 20px;
      }

      .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        color: white;
      }

      .badge-General {
        background: #2196f3;
      }
      .badge-Maintenance {
        background: #ff9800;
      }
      .badge-Promotion {
        background: #4caf50;
      }
      .badge-PolicyUpdate {
        background: #9c27b0;
      }

      .status-active {
        color: #4caf50;
        font-weight: 500;
      }

      .status-inactive {
        color: #999;
        font-weight: 500;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        padding: 40px 0;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        border-radius: 8px;
      }

      .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        color: #999;
      }

      .empty-content mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ddd;
      }

      @media (max-width: 600px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions button {
          width: 100%;
        }

        mat-table {
          font-size: 12px;
        }
      }
    `,
  ],
})
export class AnnouncementsManagementComponent implements OnInit, OnDestroy {
  @ViewChild('announcementsTable') announcementsTable?: ElementRef;

  private readonly announcementService = inject(AnnouncementService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  announcementForm: FormGroup;
  announcements: Announcement[] = [];
  displayedColumns: string[] = ['title', 'type', 'target', 'status', 'actions'];

  readonly loading = signal(false);
  readonly editingId = signal<string | null>(null);

  constructor() {
    this.announcementForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      TitleUz: ['', Validators.required],
      TitleRu: ['', Validators.required],
      TitleEn: ['', Validators.required],
      ContentUz: ['', Validators.required],
      ContentRu: ['', Validators.required],
      ContentEn: ['', Validators.required],
      Type: ['General', Validators.required],
      Target: ['AllUsers', Validators.required],
      IsActive: [true],
      PublishedAt: [null],
      ExpiresAt: [null],
    });
  }

  private loadAnnouncements(): void {
    this.loading.set(true);
    this.announcementService
      .getAnnouncements(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.announcements = result.items;
          this.loading.set(false);
        },
        error: (_error) => {
          this.toast.error("E'lonlarni yuklashda xato");
          this.loading.set(false);
        },
      });
  }

  saveAnnouncement(): void {
    if (!this.announcementForm.valid) return;

    const formValue = this.announcementForm.value;
    const payload = this.buildAnnouncementPayload(formValue);
    this.loading.set(true);

    const subscription = this.editingId()
      ? this.announcementService.updateAnnouncement(this.editingId()!, payload)
      : this.announcementService.createAnnouncement(payload);

    subscription.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const message = this.editingId()
          ? "E'lon muvaffaqiyatli yangilandi"
          : "E'lon muvaffaqiyatli yaratildi";
        this.toast.success(message);
        this.resetForm();
        this.loadAnnouncements();
        // Scroll to announcements table after successful save to show updated list
        setTimeout(() => {
          if (this.announcementsTable) {
            this.announcementsTable.nativeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 300);
      },
      error: (_error) => {
        this.toast.error(this.editingId() ? "E'lonni yangilashda xato" : "E'lonni yaratishda xato");
        this.loading.set(false);
      },
    });
  }

  editAnnouncement(announcement: Announcement): void {
    this.editingId.set(announcement.id);
    this.announcementForm.patchValue({
      TitleUz: announcement.titleUz,
      TitleRu: announcement.titleRu,
      TitleEn: announcement.titleEn,
      ContentUz: announcement.contentUz,
      ContentRu: announcement.contentRu,
      ContentEn: announcement.contentEn,
      Type: announcement.type,
      Target: announcement.target,
      IsActive: announcement.isActive,
      PublishedAt: announcement.publishedAt,
      ExpiresAt: announcement.expiresAt,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteAnnouncement(id: string): void {
    if (confirm("Bu e'lonni o'chirishni xohlaysizmi?")) {
      this.loading.set(true);
      this.announcementService
        .deleteAnnouncement(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toast.success("E'lon muvaffaqiyatli o'chirildi");
            this.loadAnnouncements();
          },
          error: () => {
            this.toast.error("E'lonni o'chirishda xato");
            this.loading.set(false);
          },
        });
    }
  }

  resetForm(): void {
    this.announcementForm.reset(this.createForm().value);
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  getTypeLabel(type: Announcement['type']): string {
    const labels: Record<string, string> = {
      General: 'Umumiy',
      Maintenance: 'Texnik ishlar',
      Promotion: 'Aksiya',
      PolicyUpdate: "Siyosat o'zgarishi",
    };
    return labels[type] || type;
  }

  getTargetLabel(target: Announcement['target']): string {
    const labels: Record<string, string> = {
      AllUsers: 'Barcha foydalanuvchilar',
      Hosts: 'Uy egalari',
      Guests: 'Mehmonlar',
      Admins: 'Adminlar',
    };
    return labels[target] || target;
  }

  private buildAnnouncementPayload(formValue: Record<string, unknown>): CreateAnnouncementRequest {
    const currentUserId = this.authService.currentUser()?.id ?? '';
    const existingAnnouncement = this.editingId()
      ? this.announcements.find((announcement) => announcement.id === this.editingId())
      : null;

    return {
      Id: existingAnnouncement?.id ?? crypto.randomUUID(),
      CreatedBy: existingAnnouncement?.createdBy ?? currentUserId,
      TitleUz: formValue['TitleUz'] as string,
      TitleRu: formValue['TitleRu'] as string,
      TitleEn: formValue['TitleEn'] as string,
      ContentUz: formValue['ContentUz'] as string,
      ContentRu: formValue['ContentRu'] as string,
      ContentEn: formValue['ContentEn'] as string,
      Type: formValue['Type'] as CreateAnnouncementRequest['Type'],
      Target: formValue['Target'] as CreateAnnouncementRequest['Target'],
      IsActive: Boolean(formValue['IsActive']),
      PublishedAt: formValue['PublishedAt']
        ? new Date(formValue['PublishedAt'] as string)
        : undefined,
      ExpiresAt: formValue['ExpiresAt'] ? new Date(formValue['ExpiresAt'] as string) : undefined,
    };
  }
}
