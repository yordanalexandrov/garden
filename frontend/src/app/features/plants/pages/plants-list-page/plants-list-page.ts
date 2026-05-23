import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plants-list-page',
  template:
    '<section aria-labelledby="plants-title"><h1 id="plants-title">Plants</h1><p>Reusable plant definitions will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantsListPage {}
