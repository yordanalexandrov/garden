import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AiGenerationResult } from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import { AiProductRulesDialog, AiProductRulesDialogData } from './ai-product-rules-dialog';

function setup(
  apiStub: Partial<AiApiService>,
  data: AiProductRulesDialogData = { productId: 'prod-1', productName: 'Test Fungicide' },
): ComponentFixture<AiProductRulesDialog> {
  TestBed.configureTestingModule({
    imports: [AiProductRulesDialog],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: AiApiService, useValue: apiStub },
    ],
  });

  const fixture = TestBed.createComponent(AiProductRulesDialog);
  fixture.detectChanges();
  return fixture;
}

const generationResult: AiGenerationResult = {
  aiSession: { id: 's1', kind: 'product_rule_generation', inputMode: 'name', status: 'completed' },
  suggestions: [
    {
      id: 'sug-1',
      suggestionType: 'product_rule',
      payload: { productId: 'prod-1', plantId: 'plant-1', operation: 'create', plantName: 'Домат', doseValue: 10, doseUnit: 'ml' },
    },
  ],
  warnings: ['Потвърдете преди запис.'],
};

describe('AiProductRulesDialog', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads generated rule suggestions on init and renders a card', () => {
    const fixture = setup({ productRuleGeneration: () => of(generationResult) });

    const component = fixture.componentInstance;
    expect(component.loading()).toBe(false);
    expect(component.suggestionStates()).toHaveLength(1);
    expect(component.warnings).toEqual(['Потвърдете преди запис.']);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-ai-suggestion-card')).not.toBeNull();
  });

  it('shows an empty message when the AI returns no suggestions', () => {
    const fixture = setup({
      productRuleGeneration: () => of({ ...generationResult, suggestions: [], warnings: [] }),
    });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ИИ не предложи правила');
  });

  it('surfaces a session error when generation fails', () => {
    const fixture = setup({
      productRuleGeneration: () => throwError(() => ({ code: 'EXTERNAL_SERVICE_ERROR', message: 'fail' })),
    });

    expect(fixture.componentInstance.sessionError()).not.toBeNull();
  });

  it('applies the edited payload and accepts a suggestion', () => {
    const acceptSpy = vi.fn().mockReturnValue(
      of({ acceptedSuggestionId: 'sug-1', createdEntities: [{ entityType: 'product_rule', entityId: 'rule-9' }], updatedEntities: [] }),
    );
    const fixture = setup({
      productRuleGeneration: () => of(generationResult),
      acceptSuggestion: acceptSpy,
    });

    fixture.componentInstance.onAccept({ suggestionId: 'sug-1', editedPayload: { plantId: 'plant-1' } });

    expect(acceptSpy).toHaveBeenCalledWith('sug-1', { editedPayload: { plantId: 'plant-1' } });
    expect(fixture.componentInstance.getState({ id: 'sug-1' } as never)?.status).toBe('accepted');
  });
});
