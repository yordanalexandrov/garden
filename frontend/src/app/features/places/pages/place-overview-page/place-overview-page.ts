import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-place-overview-page',
  template:
    '<section aria-labelledby="place-overview-title"><h1 id="place-overview-title">Place Overview</h1><p>Place overview will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceOverviewPage {}
