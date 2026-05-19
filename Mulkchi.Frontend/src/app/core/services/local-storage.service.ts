import { Injectable, signal } from '@angular/core';

export interface StorageData<T = any> {
  key: string;
  data: T;
  expiresAt?: number; // Timestamp in ms
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly storageKey = 'mulkchi_storage';
  private data = signal<Map<string, any>>(new Map());

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Set item in storage with optional expiration
   */
  setItem<T>(key: string, value: T, expirationMinutes?: number): void {
    const item: StorageData<T> = {
      key,
      data: value,
    };

    if (expirationMinutes) {
      item.expiresAt = Date.now() + expirationMinutes * 60 * 1000;
    }

    const storage = this.data();
    storage.set(key, item);
    this.data.set(storage);
    this.saveToLocalStorage();
  }

  /**
   * Get item from storage
   */
  getItem<T>(key: string): T | null {
    const item = this.data().get(key) as StorageData<T> | undefined;

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.removeItem(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if item exists
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    const storage = this.data();
    storage.delete(key);
    this.data.set(storage);
    this.saveToLocalStorage();
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    this.data.set(new Map());
    this.saveToLocalStorage();
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.data().keys());
  }

  /**
   * Add to array in storage
   */
  addToArray<T>(key: string, value: T, maxItems = 20): void {
    let array = this.getItem<T[]>(key) || [];

    // Remove duplicates if it's a string or object with id
    if (typeof value === 'string') {
      array = array.filter((item) => item !== value);
    } else if (typeof value === 'object' && value !== null && 'id' in value) {
      array = array.filter((item) => {
        return !((item as any).id === (value as any).id);
      });
    }

    // Add to beginning
    array.unshift(value);

    // Keep only max items
    if (array.length > maxItems) {
      array = array.slice(0, maxItems);
    }

    this.setItem(key, array);
  }

  /**
   * Get array from storage
   */
  getArray<T>(key: string): T[] {
    return this.getItem<T[]>(key) || [];
  }

  /**
   * Remove from array
   */
  removeFromArray<T>(key: string, predicate: (item: T) => boolean): void {
    const array = this.getItem<T[]>(key) || [];
    const filtered = array.filter((item) => !predicate(item));
    this.setItem(key, filtered);
  }

  /**
   * Private: Save to browser localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const storage = this.data();
      const json = JSON.stringify(Array.from(storage.entries()));
      localStorage.setItem(this.storageKey, json);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Private: Load from browser localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (json) {
        const entries = JSON.parse(json);
        const map = new Map<string, any>(entries);
        this.data.set(map);
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }
}
