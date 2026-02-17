export type ProductEventName =
  | "auth_login_success"
  | "auth_signup_success"
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "insights_viewed"
  | "insights_whatif_changed"
  | "insights_goal_updated";

export type ProductEventContext =
  | "auth"
  | "expenses"
  | "insights"
  | "dashboard"
  | "settings";

export interface ProductEventPayload {
  name: ProductEventName;
  context: ProductEventContext;
  metadata?: Record<string, unknown>;
}
