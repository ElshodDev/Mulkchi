import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

export interface ValidationError {
  code: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class FormValidationService {
  private readonly errorMessages: Record<string, Record<string, string>> = {
    title: {
      required: 'Sarlavha kiritilishi shart',
      minlength: "Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak",
      maxlength: "Sarlavha 100 ta belgidan ko'p bo'lishi mumkin emas",
    },
    price: {
      required: 'Narxi kiritilishi shart',
      pattern: 'Faqat raqamlar kiritilishi kerak',
      min: "Narxi noldan katta bo'lishi kerak",
    },
    area: {
      required: 'Maydoni kiritilishi shart',
      pattern: 'Faqat raqamlar kiritilishi kerak',
      min: "Maydoni noldan katta bo'lishi kerak",
    },
    email: {
      required: 'Email kiritilishi shart',
      email: "Email manzili noto'g'ri formatda",
    },
    phone: {
      required: 'Telefon raqami kiritilishi shart',
      pattern: "Telefon raqami noto'g'ri formatda",
    },
    description: {
      required: 'Tavsif kiritilishi shart',
      minlength: "Tavsif kamida 20 ta belgidan iborat bo'lishi kerak",
    },
  };

  getErrorMessage(control: AbstractControl | null, fieldName: string): string | null {
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const errors = control.errors;
    const messages = this.errorMessages[fieldName] || {};

    for (const errorKey of Object.keys(errors)) {
      if (messages[errorKey]) {
        return messages[errorKey];
      }
    }

    return "Notog'ri ma'lumot";
  }

  hasError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFormErrorsSummary(form: any): string[] {
    const errors: string[] = [];

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control && control.errors && control.touched) {
        const errorMessage = this.getErrorMessage(control, key);
        if (errorMessage) {
          errors.push(errorMessage);
        }
      }
    });

    return errors;
  }

  markAllAsTouched(form: any): void {
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorCount(form: any): number {
    let count = 0;
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control && control.errors && control.touched) {
        count++;
      }
    });
    return count;
  }
}
