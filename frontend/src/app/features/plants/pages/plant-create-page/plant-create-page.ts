import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plant-create-page',
  template:
    '<section aria-labelledby="plant-create-title"><h1 id="plant-create-title">New Plant</h1><p>Plant creation will load here.</p></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantCreatePage {}
