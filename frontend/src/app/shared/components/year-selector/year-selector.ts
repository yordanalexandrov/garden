import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-year-selector',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './year-selector.html',
  styleUrl: './year-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearSelector {
  readonly year = input.required<number>();
  readonly yearChange = output<number>();
  readonly label = computed(() => String(this.year()));

  previousYear(): void {
    this.yearChange.emit(this.year() - 1);
  }

  nextYear(): void {
    this.yearChange.emit(this.year() + 1);
  }
}
