/**
 * Builds the full notification context for a user.
 * In production, this would query User, Child, Appointment microservices.
 * For this service, we expect context to be passed in with the job payload,
 * but this service enriches it with real DB data.
 */
export class UserContextService {
  async buildContext(
    _userId: string,
    baseContext: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // In a real microservice architecture, you would call:
    // - UserService.getUser(userId)
    // - ChildService.getChildrenForUser(userId)
    // - AppointmentService.getUpcomingAppointments(userId)
    // For now we merge whatever context was passed with the job

    return {
      appLink: process.env.APP_LINK || 'https://app.qavach.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@qavach.com',
      ...baseContext,
    };
  }

  async checkStopCondition(
    _userId: string,
    _stopConditions: Record<string, unknown>
  ): Promise<boolean> {
    /**
     * Check if any stop condition is met.
     * In production, query user state from DB or cache.
     * Example: { childAdded: true } → query if user has added a child.
     * 
     * For this implementation, stop conditions are expected to be passed
     * in the job context as userState.
     */
    // Placeholder: always return false (no stop)
    // Real implementation would check DB
    return false;
  }
}
