import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plant-detail-page',
  template:
    '<section aria-labelledby="plant-detail-title"><h1 id="plant-detail-title">Plant Detail</h1><p>Plant detail will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantDetailPage {}
