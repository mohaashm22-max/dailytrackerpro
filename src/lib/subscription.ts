export type SubscriptionPlan = "free" | "premium_monthly" | "premium_yearly";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "inactive";
export type BillingCycle = "none" | "monthly" | "yearly";

export interface Subscription {
  id: string;
  user_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_credits: number;
  ai_usage: number;
}

export const PRICING = {
  monthly: { amount: 9.99, label: "$9.99", period: "month" },
  yearly: { amount: 99, label: "$99", period: "year" },
} as const;

export const FREE_LIMITS = {
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024,
};

export const PREMIUM_LIMITS = {
  maxFiles: Infinity,
  maxFileSize: 100 * 1024 * 1024,
};

export const ALLOWED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "text/plain": "TXT",
};

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "xlsx", "xls", "jpg", "jpeg", "png", "txt"];

export function isPremiumPlan(plan: SubscriptionPlan | undefined, status?: SubscriptionStatus) {
  if (!plan || plan === "free") return false;
  if (status && !["active", "trialing", "past_due"].includes(status)) return false;
  return true;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isFileTypeAllowed(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return Boolean(ALLOWED_FILE_TYPES[file.type]) || ALLOWED_EXTENSIONS.includes(ext);
}
