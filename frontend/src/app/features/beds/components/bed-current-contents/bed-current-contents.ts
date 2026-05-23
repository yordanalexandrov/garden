import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BedCurrentPersistentPlant, BedCurrentYearlyPlanting } from '../../beds.models';

@Component({
  selector: 'app-bed-current-contents',
  templateUrl: './bed-current-contents.html',
  styleUrl: './bed-current-contents.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedCurrentContentsComponent {
  readonly persistentPlants = input<readonly BedCurrentPersistentPlant[]>([]);
  readonly yearlyPlantings = input<readonly BedCurrentYearlyPlanting[]>([]);
}
