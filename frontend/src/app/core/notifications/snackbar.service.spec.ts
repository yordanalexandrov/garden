import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  const snackBar = {
    open: vi.fn(),
  };

  beforeEach(() => {
    snackBar.open.mockReset();

    TestBed.configureTestingModule({
      providers: [SnackbarService, { provide: MatSnackBar, useValue: snackBar }],
    });
  });

  it('opens an informational snackbar with an accessible default action', () => {
    const service = TestBed.inject(SnackbarService);

    service.showMessage('Saved');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Saved',
      'Dismiss',
      expect.objectContaining({
        duration: undefined,
        politeness: 'polite',
      }),
    );
  });

  it('opens an assertive snackbar for global errors', () => {
    const service = TestBed.inject(SnackbarService);

    service.showError('Request failed', { action: 'Close', durationMs: 7000 });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Request failed',
      'Close',
      expect.objectContaining({
        duration: undefined,
        politeness: 'assertive',
      }),
    );
  });

  it('auto-dismisses non-actionable messages', () => {
    const service = TestBed.inject(SnackbarService);

    service.showMessage('Saved', { action: null });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Saved',
      undefined,
      expect.objectContaining({
        duration: 5000,
        politeness: 'polite',
      }),
    );
  });
});
