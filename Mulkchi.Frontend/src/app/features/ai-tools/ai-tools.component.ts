import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AIService } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="ai-tools-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>
              <mat-icon>psychology</mat-icon>
              AI Yordamchi
            </h1>
            <p>Sun'iy intellekt yordamida mulk tanlash va tahlil qilish</p>
          </div>
        </div>

        <!-- Quick Access Cards -->
        <div class="quick-access-grid">
          <mat-card class="feature-card" routerLink="/ai-recommendations">
            <mat-card-header>
              <mat-icon mat-card-avatar>recommend</mat-icon>
              <mat-card-title>Shaxsiy Tavsiyalar</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Sizga mos keladigan mulklarni AI topib beradi</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">
                Batafsil
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="feature-card" routerLink="/ai-price">
            <mat-card-header>
              <mat-icon mat-card-avatar>trending_up</mat-icon>
              <mat-card-title>Narx Bashorati</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Mulkning bozor qiymatini aniqlang</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">
                Batafsil
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="feature-card" routerLink="/smart-analytics">
            <mat-card-header>
              <mat-icon mat-card-avatar>insights</mat-icon>
              <mat-card-title>Aqlli Tahlil</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Investitsiya imkoniyatlarini o'rganing</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">
                Batafsil
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- AI Assistant Chat -->
        <mat-card class="chat-assistant">
          <mat-card-header>
            <mat-icon mat-card-avatar>smart_toy</mat-icon>
            <mat-card-title>AI Yordamchi Chat</mat-card-title>
            <mat-card-subtitle>24/7 maslahat beruvchi</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="chat-preview">
              <div class="message bot">
                <mat-icon>smart_toy</mat-icon>
                <p>Qaysi tumanda mulk izlayapsiz? Men sizga eng yaxshi variantlarni topishga yordam beraman.</p>
              </div>
              <div class="message user">
                <p>Chilonzor 3 xonali kvartira</p>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" class="full-width">
              <mat-icon>chat</mat-icon>
              AI Yordamchini Boshlash
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .ai-tools-container {
      padding: var(--space-6) 0;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%);
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: var(--space-3);
      color: var(--color-text-primary);
    }

    .page-header h1 mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: var(--color-brand-600);
    }

    .page-header p {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      max-width: 600px;
      margin: 0 auto;
    }

    .quick-access-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .feature-card {
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-brand-200);
    }

    .feature-card mat-card-avatar {
      background: var(--color-brand-100);
      color: var(--color-brand-600);
    }

    .feature-card mat-card-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .feature-card p {
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .chat-assistant {
      max-width: 800px;
      margin: 0 auto;
    }

    .chat-preview {
      background: var(--color-surface-elevated);
      border-radius: var(--radius-3);
      padding: var(--space-4);
      min-height: 200px;
    }

    .message {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      align-items: flex-start;
    }

    .message.bot {
      flex-direction: row;
    }

    .message.user {
      flex-direction: row-reverse;
      text-align: right;
    }

    .message.bot mat-icon {
      color: var(--color-brand-600);
      background: var(--color-brand-100);
      padding: var(--space-1);
      border-radius: 50%;
    }

    .message p {
      background: var(--color-surface);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-2);
      margin: 0;
      max-width: 70%;
    }

    .message.user p {
      background: var(--color-brand-600);
      color: white;
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 768px) {
      .page-header h1 {
        font-size: 2rem;
      }

      .quick-access-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }

      .message p {
        max-width: 85%;
      }
    }
  `]
})
export class AiToolsComponent implements OnInit {
  protected readonly aiService = inject(AIService);

  ngOnInit(): void {
    // Preload AI data if needed
  }
}
