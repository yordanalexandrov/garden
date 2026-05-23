import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-place-beds-page',
  template:
    '<section aria-labelledby="place-beds-title"><h1 id="place-beds-title">Place Beds</h1><p>Beds will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceBedsPage {}
