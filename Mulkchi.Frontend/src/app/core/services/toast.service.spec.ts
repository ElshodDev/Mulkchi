import { TestBed } from '@angular/core/testing';
import { ToastService, ToastComponent } from './toast.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ToastService', () => {
  let service: ToastService;
  let snackBarSpy: any;

  beforeEach(() => {
    snackBarSpy = {
      openFromComponent: jasmine.createSpy('openFromComponent')
    };

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });
    
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success toast', () => {
    service.success('Operation successful');
    
    expect(snackBarSpy.openFromComponent).toHaveBeenCalledWith(
      ToastComponent,
      jasmine.objectContaining({
        data: { message: 'Operation successful', type: 'success', action: undefined }
      })
    );
  });

  it('should show error toast', () => {
    service.error('Operation failed', 'Retry');
    
    expect(snackBarSpy.openFromComponent).toHaveBeenCalledWith(
      ToastComponent,
      jasmine.objectContaining({
        data: { message: 'Operation failed', type: 'error', action: 'Retry' }
      })
    );
  });

  it('should show warning toast', () => {
    service.warning('Check input');
    
    expect(snackBarSpy.openFromComponent).toHaveBeenCalledWith(
      ToastComponent,
      jasmine.objectContaining({
        data: { message: 'Check input', type: 'warning', action: undefined }
      })
    );
  });

  it('should show info toast', () => {
    service.info('Update available');
    
    expect(snackBarSpy.openFromComponent).toHaveBeenCalledWith(
      ToastComponent,
      jasmine.objectContaining({
        data: { message: 'Update available', type: 'info', action: undefined }
      })
    );
  });
});
