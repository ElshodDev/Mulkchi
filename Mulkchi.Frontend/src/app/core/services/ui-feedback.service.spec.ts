import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UIFeedbackService } from './ui-feedback.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('UIFeedbackService', () => {
  let service: UIFeedbackService;
  let snackBarSpy: any;
  let snackBarRefSpy: any;

  beforeEach(() => {
    snackBarRefSpy = {
      onAction: () => of(),
      dismiss: jasmine.createSpy('dismiss'),
      afterDismissed: () => of({ dismissedByAction: false })
    };

    snackBarSpy = {
      open: jasmine.createSpy('open').and.returnValue(snackBarRefSpy),
      dismiss: jasmine.createSpy('dismiss')
    };

    TestBed.configureTestingModule({
      providers: [
        UIFeedbackService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });
    
    service = TestBed.inject(UIFeedbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    service.success('Item saved');
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '✅ Item saved',
      'OK',
      jasmine.objectContaining({
        panelClass: ['snackbar-success']
      })
    );
  });

  it('should show error notification', () => {
    service.error('Failed to save');
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '❌ Failed to save',
      'Yopish',
      jasmine.objectContaining({
        panelClass: ['snackbar-error']
      })
    );
  });

  it('should show info notification via notify wrapper', () => {
    service.notify('Did you know?', 'info');
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'ℹ️ Did you know?',
      'OK',
      jasmine.objectContaining({
        panelClass: ['snackbar-info']
      })
    );
  });

  it('should show loading indicator', () => {
    service.loading('Processing...');
    
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '⏳ Processing...',
      'Yopish',
      jasmine.objectContaining({
        panelClass: ['snackbar-loading'],
        duration: 0
      })
    );
  });

  it('should dismiss all snackbars', () => {
    service.clearAll();
    expect(snackBarSpy.dismiss).toHaveBeenCalled();
  });

  it('should resolve false if dismissed without action in confirm', fakeAsync(() => {
    snackBarRefSpy.afterDismissed = () => of({ dismissedByAction: false });
    
    let result: boolean | undefined;
    service.confirm('Are you sure?').then(res => {
      result = res;
    });

    tick();
    expect(result).toBe(false);
  }));

  it('should resolve true if action is clicked in confirm', fakeAsync(() => {
    snackBarRefSpy.onAction = () => of(void 0);
    snackBarRefSpy.afterDismissed = () => of({ dismissedByAction: true });
    
    let result: boolean | undefined;
    service.confirm('Are you sure?').then(res => {
      result = res;
    });

    tick();
    expect(result).toBe(true);
    expect(snackBarRefSpy.dismiss).toHaveBeenCalled();
  }));
});
