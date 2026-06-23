const ADMIN_EMAILS = [
  "zhangrouchennn@gmail.com",
  "successthecodess@gmail.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}