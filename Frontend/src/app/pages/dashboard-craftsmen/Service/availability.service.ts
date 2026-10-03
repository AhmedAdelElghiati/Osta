import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {

  private _isAvailable = signal(true);

  readonly isAvailable = this._isAvailable.asReadonly();

  set(value: boolean) {
    this._isAvailable.set(value);
  }

  toggle() {
    this._isAvailable.update(v => !v);
  }
}