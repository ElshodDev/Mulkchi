import { CommonModule } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface SmartSuggestion {
  id: string;
  text: string;
  type: 'location' | 'property-type' | 'price-range' | 'feature' | 'recent';
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="smart-search-container">
      <form [formGroup]="searchForm" class="search-form">
        <!-- Main Search Input -->
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            formControlName="query"
            placeholder="Qidiruv (masalan: 'Chilonzorda 3 xonali', 'arzon kvartira')"
            (keyup)="onSearchInput($event)"
            (focus)="showSuggestions.set(true)"
            [matMenuTriggerFor]="suggestionsMenu"
            #searchInput
          />

          <!-- Voice Search Button -->
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="startVoiceSearch()"
            [class.active]="isListening()"
            [attr.aria-label]="listeningLabel"
          >
            <mat-icon>{{ isListening() ? 'mic' : 'mic_none' }}</mat-icon>
          </button>

          <!-- Clear Button -->
          @if (searchForm.value.query) {
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="clearSearch()"
              [attr.aria-label]="'Tozalash'"
            >
              <mat-icon>clear</mat-icon>
            </button>
          }
        </mat-form-field>

        <!-- Quick Filters -->
        <div class="quick-filters">
          @for (filter of quickFilters(); track filter.id) {
            <button
              mat-chip
              [class.selected]="selectedFilters().has(filter.id)"
              (click)="toggleFilter(filter)"
              class="haptic-feedback"
            >
              <mat-icon>{{ filter.icon }}</mat-icon>
              {{ filter.label }}
            </button>
          }
        </div>

        <!-- Search Button -->
        <button
          mat-raised-button
          color="primary"
          class="search-button"
          (click)="performSearch()"
          [disabled]="!searchForm.value.query.trim()"
        >
          <mat-icon>search</mat-icon>
          Qidirish
        </button>
      </form>

      <!-- AI Suggestions Menu -->
      <mat-menu #suggestionsMenu="matMenu" class="suggestions-menu" xPosition="before">
        <div class="suggestions-header">
          <mat-icon>psychology</mat-icon>
          <span>AI Tavsiyalari</span>
        </div>

        @if (isLoading()) {
          <div class="suggestions-loading">
            <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
            <span>Qidirilmoqda...</span>
          </div>
        } @else {
          @for (suggestion of suggestions(); track suggestion.id) {
            <button mat-menu-item (click)="selectSuggestion(suggestion)" class="suggestion-item">
              <mat-icon>{{ suggestion.icon }}</mat-icon>
              <div class="suggestion-content">
                <div class="suggestion-text">{{ suggestion.text }}</div>
                @if (suggestion.description) {
                  <div class="suggestion-description">{{ suggestion.description }}</div>
                }
              </div>
              <span class="suggestion-type">{{ suggestion.type }}</span>
            </button>
          }
        }

        @if (suggestions().length === 0 && !isLoading()) {
          <div class="no-suggestions">
            <mat-icon>search_off</mat-icon>
            <span>Tavsiyalar topilmadi</span>
          </div>
        }
      </mat-menu>

      <!-- Recent Searches -->
      @if (recentSearches().length > 0 && !searchForm.value.query) {
        <div class="recent-searches">
          <div class="recent-header">
            <mat-icon>history</mat-icon>
            <span>So'nggi qidiruvlar</span>
            <button mat-icon-button (click)="clearRecentSearches()">
              <mat-icon>clear_all</mat-icon>
            </button>
          </div>
          <div class="recent-list">
            @for (search of recentSearches(); track search.id) {
              <button class="recent-item haptic-feedback" (click)="selectRecentSearch(search)">
                <mat-icon>history</mat-icon>
                <span>{{ search.query }}</span>
                <mat-icon>arrow_forward</mat-icon>
              </button>
            }
          </div>
        </div>
      }

      <!-- Voice Search Indicator -->
      @if (isListening()) {
        <div class="voice-indicator">
          <div class="voice-pulse"></div>
          <span>Gapiring...</span>
          <button mat-icon-button (click)="stopVoiceSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .smart-search-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .search-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .search-field {
        width: 100%;
      }

      .search-field .mat-mdc-form-field-flex {
        align-items: center;
      }

      .search-field input {
        font-size: 16px; /* Prevents zoom on mobile */
      }

      .quick-filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .quick-filters mat-chip {
        transition: all 0.2s ease;
      }

      .quick-filters mat-chip.selected {
        background: var(--color-brand-600);
        color: white;
      }

      .search-button {
        width: 100%;
        min-height: var(--touch-target-comfortable);
        font-weight: 600;
      }

      /* Suggestions Menu */
      .suggestions-menu {
        min-width: 350px;
        max-width: 500px;
        max-height: 400px;
        overflow-y: auto;
      }

      .suggestions-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        border-bottom: 1px solid var(--color-border-soft);
        font-weight: 600;
        color: var(--color-brand-600);
      }

      .suggestions-loading {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        justify-content: center;
        color: var(--color-text-secondary);
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        min-height: 60px;
        transition: background-color 0.2s ease;
      }

      .suggestion-item:hover {
        background: var(--color-surface-elevated);
      }

      .suggestion-content {
        flex: 1;
      }

      .suggestion-text {
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .suggestion-description {
        font-size: var(--font-size-2);
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
      }

      .suggestion-type {
        font-size: var(--font-size-1);
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-weight: 600;
      }

      .no-suggestions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-6);
        color: var(--color-text-secondary);
      }

      /* Recent Searches */
      .recent-searches {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: var(--color-surface-elevated);
        border-radius: var(--radius-3);
      }

      .recent-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .recent-header span {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .recent-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .recent-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        border-radius: var(--radius-2);
        background: var(--color-surface);
        transition: all 0.2s ease;
        text-align: left;
      }

      .recent-item:hover {
        background: var(--color-surface-elevated);
        transform: translateX(4px);
      }

      .recent-item span {
        flex: 1;
        color: var(--color-text-primary);
      }

      .recent-item mat-icon:last-child {
        color: var(--color-text-muted);
      }

      /* Voice Search */
      .voice-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-6);
        background: var(--color-surface-elevated);
        border-radius: var(--radius-3);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
      }

      .voice-pulse {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--color-brand-600);
        position: relative;
        animation: voicePulse 1.5s ease-in-out infinite;
      }

      .voice-pulse::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border-radius: 50%;
        border: 2px solid var(--color-brand-600);
        animation: voiceWave 1.5s ease-in-out infinite;
      }

      @keyframes voicePulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }

      @keyframes voiceWave {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      /* Mobile Optimizations */
      @media (max-width: 768px) {
        .suggestions-menu {
          min-width: 280px;
          max-width: calc(100vw - 32px);
        }

        .quick-filters {
          justify-content: center;
        }

        .voice-indicator {
          width: calc(100vw - 32px);
          max-width: 300px;
        }

        .voice-pulse {
          width: 60px;
          height: 60px;
        }
      }
    `,
  ],
})
export class SmartSearchComponent {
  private formBuilder = inject(FormBuilder);

  searchForm: FormGroup = this.formBuilder.group({
    query: [''],
  });

  // Signals
  isLoading = signal(false);
  isListening = signal(false);
  showSuggestions = signal(false);
  suggestions = signal<SmartSuggestion[]>([]);
  selectedFilters = signal<Set<string>>(new Set());
  recentSearches = signal<Array<{ id: string; query: string; timestamp: number }>>([]);

  // Outputs
  search = output<{ query: string; filters: string[] }>();
  voiceSearch = output<string>();

  // Accessibility label helper to avoid nested quotes in template
  get listeningLabel(): string {
    return this.isListening() ? 'Ovozli qidiruvni to\u02BCxtatish' : 'Ovozli qidiruv';
  }

  // Quick filters
  quickFilters = computed(() => [
    { id: 'rent', label: 'Ijara', icon: 'home' },
    { id: 'sale', label: 'Sotish', icon: 'sell' },
    { id: 'cheap', label: 'Arzon', icon: 'savings' },
    { id: 'new', label: 'Yangi', icon: 'new_releases' },
    { id: 'urgent', label: 'Shoshilinch', icon: 'priority_high' },
  ]);

  constructor() {
    // Load recent searches from localStorage
    this.loadRecentSearches();

    // Setup search input debouncing
    this.searchForm
      .get('query')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        if (query?.trim()) {
          this.fetchSuggestions(query.trim());
        } else {
          this.suggestions.set([]);
        }
      });
  }

  onSearchInput(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  async fetchSuggestions(query: string): Promise<void> {
    this.isLoading.set(true);

    try {
      // Simulate API call - replace with actual AI service
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockSuggestions: SmartSuggestion[] = [
        {
          id: '1',
          text: 'Chilonzor 3 xonali kvartiralar',
          type: 'location',
          icon: 'location_on',
          description: '124 ta topildi',
        },
        {
          id: '2',
          text: 'Arzon 2 xonali uylar',
          type: 'price-range',
          icon: 'savings',
          description: '89 ta topildi',
        },
        {
          id: '3',
          text: 'Yangi qurilgan binolar',
          type: 'feature',
          icon: 'new_releases',
          description: '45 ta topildi',
        },
      ];

      this.suggestions.set(mockSuggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectSuggestion(suggestion: SmartSuggestion): void {
    this.searchForm.patchValue({ query: suggestion.text });
    this.showSuggestions.set(false);
    this.performSearch();
  }

  toggleFilter(filter: { id: string; label: string; icon: string }): void {
    const currentFilters = new Set(this.selectedFilters());
    if (currentFilters.has(filter.id)) {
      currentFilters.delete(filter.id);
    } else {
      currentFilters.add(filter.id);
    }
    this.selectedFilters.set(currentFilters);
  }

  performSearch(): void {
    const query = this.searchForm.value.query?.trim();
    if (!query) return;

    // Add to recent searches
    this.addToRecentSearches(query);

    // Emit search event
    this.search.emit({
      query,
      filters: Array.from(this.selectedFilters()),
    });

    this.showSuggestions.set(false);
  }

  clearSearch(): void {
    this.searchForm.patchValue({ query: '' });
    this.suggestions.set([]);
    this.selectedFilters.set(new Set());
  }

  startVoiceSearch(): void {
    if (!this.isListening()) {
      this.isListening.set(true);
      // Initialize voice recognition
      this.initializeVoiceRecognition();
    } else {
      this.stopVoiceSearch();
    }
  }

  stopVoiceSearch(): void {
    this.isListening.set(false);
  }

  private initializeVoiceRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'uz-UZ';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.searchForm.patchValue({ query: transcript });
        this.voiceSearch.emit(transcript);
        this.stopVoiceSearch();
      };

      recognition.onerror = () => {
        this.stopVoiceSearch();
      };

      recognition.onend = () => {
        this.stopVoiceSearch();
      };

      recognition.start();
    } else {
      // Fallback for browsers that don't support speech recognition
      console.warn('Speech recognition not supported');
      this.stopVoiceSearch();
    }
  }

  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        const searches = JSON.parse(stored);
        this.recentSearches.set(searches.slice(0, 5)); // Keep only last 5
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }

  private addToRecentSearches(query: string): void {
    const newSearch = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
    };

    const current = this.recentSearches();
    const filtered = current.filter((s) => s.query !== query);
    const updated = [newSearch, ...filtered].slice(0, 5);

    this.recentSearches.set(updated);

    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }

  selectRecentSearch(search: { id: string; query: string; timestamp: number }): void {
    this.searchForm.patchValue({ query: search.query });
    this.performSearch();
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recentSearches');
  }
}
