import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppLoadingService {
  private readonly activeReasons = signal<ReadonlyMap<string, number>>(new Map());

  readonly isLoading = computed(() => this.activeReasons().size > 0);
  readonly reasons = computed(() => Array.from(this.activeReasons().keys()));

  start(reason = 'app'): () => void {
    this.setLoading(reason, true);

    let stopped = false;

    return () => {
      if (!stopped) {
        stopped = true;
        this.setLoading(reason, false);
      }
    };
  }

  setLoading(reason: string, loading: boolean): void {
    const nextReasons = new Map(this.activeReasons());
    const currentCount = nextReasons.get(reason) ?? 0;

    if (loading) {
      nextReasons.set(reason, currentCount + 1);
    } else if (currentCount > 1) {
      nextReasons.set(reason, currentCount - 1);
    } else {
      nextReasons.delete(reason);
    }

    this.activeReasons.set(nextReasons);
  }
}
