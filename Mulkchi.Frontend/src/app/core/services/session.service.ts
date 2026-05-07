import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly authChangesSubject = new BehaviorSubject<boolean>(false);

  readonly authChanges$ = this.authChangesSubject.asObservable();

  emitLogin(): void {
    this.authChangesSubject.next(true);
  }

  emitLogout(): void {
    this.authChangesSubject.next(false);
  }
}
