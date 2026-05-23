import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bed-detail-page',
  template:
    '<section aria-labelledby="bed-detail-title"><h1 id="bed-detail-title">Bed Detail</h1><p>Bed detail will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedDetailPage {}
