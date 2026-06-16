import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AiPayloadDialog, AiPayloadDialogData } from './ai-payload-dialog';

function setup(data: AiPayloadDialogData): {
  fixture: ComponentFixture<AiPayloadDialog>;
  component: AiPayloadDialog;
  close: ReturnType<typeof vi.fn>;
} {
  const close = vi.fn();

  TestBed.configureTestingModule({
    imports: [AiPayloadDialog],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close } },
    ],
  });

  const fixture = TestBed.createComponent(AiPayloadDialog);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, close };
}

describe('AiPayloadDialog', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('seeds the editor with the provided JSON payload', () => {
    const { component } = setup({ payloadJson: '{\n  "name": "Fungicide A"\n}' });
    expect(component.payloadControl.value).toBe('{\n  "name": "Fungicide A"\n}');
  });

  it('closes with the edited value when the JSON is valid', () => {
    const { component, close } = setup({ payloadJson: '{}' });
    component.payloadControl.setValue('{"name":"Edited"}');

    component.save();

    expect(component.parseError()).toBeNull();
    expect(close).toHaveBeenCalledWith('{"name":"Edited"}');
  });

  it('does not close and surfaces an error when the JSON is invalid', () => {
    const { component, close } = setup({ payloadJson: '{}' });
    component.payloadControl.setValue('{not valid');

    component.save();

    expect(close).not.toHaveBeenCalled();
    expect(component.parseError()).toContain('Invalid JSON');
  });

  it('closes with undefined on cancel', () => {
    const { component, close } = setup({ payloadJson: '{}' });
    component.cancel();
    expect(close).toHaveBeenCalledWith(undefined);
  });

  it('renders a read-only payload without editing controls when not editable', () => {
    const { fixture } = setup({ payloadJson: '{"name":"View only"}', editable: false });
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('textarea')).toBeNull();
    expect(compiled.querySelector('pre')?.textContent).toContain('View only');
  });
});
