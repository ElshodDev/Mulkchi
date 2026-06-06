import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class PropertyCompareService {
  private maxCompareLimit = 3;
  // Signal to hold the list of properties to compare
  public compareList = signal<any[]>([]);

  constructor(private snackBar: MatSnackBar) {}

  addToCompare(property: any) {
    const currentList = this.compareList();
    
    // Check if already in list
    if (currentList.some(p => p.id === property.id)) {
      this.snackBar.open("Bu uy qiyoslash ro'yxatida mavjud", 'Yopish', { duration: 3000 });
      return;
    }

    // Check limit
    if (currentList.length >= this.maxCompareLimit) {
      this.snackBar.open("Siz faqat 3 tagacha uyni solishtira olasiz", 'Yopish', { duration: 3000 });
      return;
    }

    this.compareList.set([...currentList, property]);
    this.snackBar.open("Uy qiyoslash ro'yxatiga qo'shildi!", 'Yopish', { duration: 3000 });
  }

  removeFromCompare(propertyId: string) {
    this.compareList.set(this.compareList().filter(p => p.id !== propertyId));
  }

  clearCompare() {
    this.compareList.set([]);
  }

  isInCompare(propertyId: string): boolean {
    return this.compareList().some(p => p.id === propertyId);
  }
}
