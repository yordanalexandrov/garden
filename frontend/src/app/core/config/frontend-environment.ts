import { InjectionToken, Provider } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { FrontendEnvironment } from '../../../environments/environment.model';

export const FRONTEND_ENVIRONMENT = new InjectionToken<FrontendEnvironment>('FrontendEnvironment', {
  providedIn: 'root',
  factory: () => environment,
});

export const provideFrontendEnvironment = (
  value: FrontendEnvironment = environment,
): Provider => ({
  provide: FRONTEND_ENVIRONMENT,
  useValue: value,
});
