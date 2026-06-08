import type { AuthenticatedActor } from "../auth/auth.types.js";
import type { DashboardQuery, DashboardRepository, DashboardSummary } from "./dashboard.types.js";

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(actor: AuthenticatedActor, input: DashboardQuery): Promise<DashboardSummary> {
    if (input.placeId !== undefined) {
      await this.dashboardRepository.ensurePlaceBelongsToAccount(actor.accountId, input.placeId);
    }

    const [
      upcomingTasks,
      suggestedTasks,
      activeQuarantinePeriods,
      recentActivities,
      openProblems,
      lowStockProducts,
      places
    ] = await Promise.all([
      this.dashboardRepository.listUpcomingTasks(actor.accountId, input),
      this.dashboardRepository.listSuggestedTasks(actor.accountId, input),
      this.dashboardRepository.listActiveQuarantinePeriods(actor.accountId, input),
      this.dashboardRepository.listRecentActivities(actor.accountId, input),
      this.dashboardRepository.listOpenProblems(actor.accountId, input),
      this.dashboardRepository.listLowStockProducts(actor.accountId, input),
      this.dashboardRepository.listPlaces(actor.accountId, input)
    ]);

    return {
      upcomingTasks,
      suggestedTasks,
      activeQuarantinePeriods,
      recentActivities,
      openProblems,
      lowStockProducts,
      places
    };
  }
}
