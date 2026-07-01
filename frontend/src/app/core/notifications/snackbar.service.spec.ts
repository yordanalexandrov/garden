import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  const snackBarRef = {
    onAction: vi.fn(),
  };
  const snackBar = {
    open: vi.fn(),
  };
  const dialog = {
    open: vi.fn(),
  };

  beforeEach(() => {
    snackBar.open.mockReset();
    snackBarRef.onAction.mockReset();
    dialog.open.mockReset();
    snackBarRef.onAction.mockReturnValue({ subscribe: vi.fn() });
    snackBar.open.mockReturnValue(snackBarRef);

    TestBed.configureTestingModule({
      providers: [
        SnackbarService,
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    });
  });

  it('opens an informational snackbar that auto-dismisses and is color-coded', () => {
    const service = TestBed.inject(SnackbarService);

    service.showMessage('Saved');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Saved',
      'Dismiss',
      expect.objectContaining({
        duration: 5000,
        panelClass: ['snackbar-success'],
        politeness: 'polite',
      }),
    );
  });

  it('opens an assertive, color-coded snackbar for global errors with a 3 minute default timeout', () => {
    const service = TestBed.inject(SnackbarService);

    service.showError('Request failed');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Request failed',
      'Details',
      expect.objectContaining({
        duration: 3 * 60 * 1000,
        panelClass: ['snackbar-error'],
        politeness: 'assertive',
      }),
    );
  });

  it('opens a detail dialog with the full message when the error action is clicked', () => {
    const service = TestBed.inject(SnackbarService);
    let actionCallback: (() => void) | undefined;
    snackBarRef.onAction.mockReturnValue({
      subscribe: (callback: () => void) => {
        actionCallback = callback;
      },
    });

    service.showError('Request failed: acceptedCategory invalid');
    actionCallback?.();

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { message: 'Request failed: acceptedCategory invalid' } }),
    );
  });

  it('respects an explicit duration override', () => {
    const service = TestBed.inject(SnackbarService);

    service.showError('Request failed', { durationMs: 7000 });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Request failed',
      'Details',
      expect.objectContaining({
        duration: 7000,
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
