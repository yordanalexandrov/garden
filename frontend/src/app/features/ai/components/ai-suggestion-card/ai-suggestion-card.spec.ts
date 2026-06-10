import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AiSuggestionCard } from './ai-suggestion-card';

const productSuggestion = {
  id: 'suggestion-1',
  suggestionType: 'product',
  payload: { name: 'Fungicide A', category: 'fungicide' },
};

describe('Phase 24 AiSuggestionCard', () => {
  let fixture: ComponentFixture<AiSuggestionCard>;
  let component: AiSuggestionCard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSuggestionCard],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AiSuggestionCard);
    component = fixture.componentInstance;
    component.suggestion = productSuggestion;
    component.status = 'unaccepted';
    component.error = null;
    component.acceptResult = null;
    component.warnings = [];
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders with explicit suggestion status badge "not saved" before accept', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('not saved');
    expect(compiled.textContent).toContain('product');
  });

  it('renders payload field entries', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('name');
    expect(compiled.textContent).toContain('category');
  });

  it('shows warnings when provided', () => {
    fixture.componentRef.setInput('warnings', ['Review label before saving.', 'Dose value estimated.']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Review label before saving.');
    expect(compiled.textContent).toContain('Dose value estimated.');
  });

  it('emits accept event with editedPayload when JSON is edited', () => {
    const acceptSpy = vi.fn();
    component.accept.subscribe(acceptSpy);
    component.editPayloadControl.setValue('{"name":"Edited Name","category":"fungicide"}');
    fixture.detectChanges();

    component.onAccept();

    expect(acceptSpy).toHaveBeenCalledWith({
      suggestionId: 'suggestion-1',
      editedPayload: { name: 'Edited Name', category: 'fungicide' },
    });
  });

  it('emits accept event without editedPayload when textarea is empty', () => {
    const acceptSpy = vi.fn();
    component.accept.subscribe(acceptSpy);
    component.editPayloadControl.setValue('');
    fixture.detectChanges();

    component.onAccept();

    const call = acceptSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(call['suggestionId']).toBe('suggestion-1');
    expect(call).not.toHaveProperty('editedPayload');
  });

  it('emits reject event with only suggestionId', () => {
    const rejectSpy = vi.fn();
    component.reject.subscribe(rejectSpy);

    component.onReject();

    expect(rejectSpy).toHaveBeenCalledWith({ suggestionId: 'suggestion-1' });
    const call = rejectSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(call)).toEqual(['suggestionId']);
  });

  it('disables accept/reject buttons while accepting', () => {
    fixture.componentRef.setInput('status', 'accepting');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('disables accept/reject buttons while rejecting', () => {
    fixture.componentRef.setInput('status', 'rejecting');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('shows accepted state with created entity links after acceptance', () => {
    fixture.componentRef.setInput('status', 'accepted');
    fixture.componentRef.setInput('acceptResult', {
      acceptedSuggestionId: 'suggestion-1',
      createdEntities: [{ entityType: 'product', entityId: 'product-1' }],
      updatedEntities: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Accepted');
    expect(compiled.textContent).toContain('product');
    expect(compiled.textContent).toContain('product-1');
  });

  it('shows rejected state without created entity links', () => {
    fixture.componentRef.setInput('status', 'rejected');
    fixture.componentRef.setInput('acceptResult', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Rejected');
    expect(compiled.textContent).not.toContain('Created records');
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('preserves edited payload values when error is set after accept attempt', () => {
    const editedValue = '{"name":"Edited","category":"herbicide"}';
    component.editPayloadControl.setValue(editedValue);

    component.error = { code: 'VALIDATION_ERROR', message: 'Name too long' };
    component.ngOnChanges({
      error: new SimpleChange(null, component.error, false),
    });
    fixture.detectChanges();

    expect(component.editPayloadControl.value).toBe(editedValue);
  });

  it('does not show accept/reject buttons after acceptance', () => {
    fixture.componentRef.setInput('status', 'accepted');
    fixture.componentRef.setInput('acceptResult', {
      acceptedSuggestionId: 'suggestion-1',
      createdEntities: [],
      updatedEntities: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
