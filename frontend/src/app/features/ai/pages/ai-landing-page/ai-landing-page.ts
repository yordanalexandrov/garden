import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PageHeader } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-ai-landing-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, PageHeader, RouterLink],
  templateUrl: './ai-landing-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiLandingPage {}
