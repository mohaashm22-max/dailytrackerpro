export type PasswordCheck = {
  id: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_CHECKS: PasswordCheck[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordScore(pw: string): number {
  return PASSWORD_CHECKS.reduce((acc, c) => acc + (c.test(pw) ? 1 : 0), 0);
}

export function isPasswordStrong(pw: string): boolean {
  return passwordScore(pw) === PASSWORD_CHECKS.length;
}

export function strengthLabel(score: number): { label: string; color: string } {
  if (score <= 1) return { label: "Very weak", color: "bg-destructive" };
  if (score === 2) return { label: "Weak", color: "bg-destructive/80" };
  if (score === 3) return { label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { label: "Good", color: "bg-amber-400" };
  return { label: "Strong", color: "bg-emerald-500" };
}
