/** Hosted Luminary v3 PWA — set VITE_APP_URL in Vercel for production */
export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://localhost:5173" : "https://luminary-app-swart.vercel.app");

export const DESKTOP_RELEASES_URL = "https://github.com/kenmuritu/luminary/releases";

export function appSignupUrl(name: string, email: string): string {
  const params = new URLSearchParams({
    welcome: "1",
    name,
    email,
  });
  return `${APP_URL}?${params.toString()}`;
}
