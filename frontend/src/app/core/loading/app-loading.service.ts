import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppLoadingService {
  private readonly activeReasons = signal<ReadonlySet<string>>(new Set());

  readonly isLoading = computed(() => this.activeReasons().size > 0);
  readonly reasons = computed(() => Array.from(this.activeReasons()));

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
    const nextReasons = new Set(this.activeReasons());

    if (loading) {
      nextReasons.add(reason);
    } else {
      nextReasons.delete(reason);
    }

    this.activeReasons.set(nextReasons);
  }
}
