import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-place-perennials-page',
  template:
    '<section aria-labelledby="place-perennials-title"><h1 id="place-perennials-title">Place Perennials</h1><p>Perennials will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacePerennialsPage {}
