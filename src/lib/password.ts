export function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  if (password.length < 8) return "weak";
  const checks = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
  const passed = checks.filter((r) => r.test(password)).length;
  if (passed >= 3) return "strong";
  if (passed >= 2) return "fair";
  return "weak";
}
