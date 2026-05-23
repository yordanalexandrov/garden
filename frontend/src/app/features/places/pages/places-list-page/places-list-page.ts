import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-places-list-page',
  template:
    '<section aria-labelledby="places-title"><h1 id="places-title">Places</h1><p>Garden places will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesListPage {}
