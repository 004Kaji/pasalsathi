// Client-side staff-mode detection. The httpOnly ps_staff cookie is invisible to
// JS, so login also sets a readable ps_staff_name display cookie. Presence of
// that cookie = staff mode (server routes still validate the real cookie).
export function getStaffName(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)ps_staff_name=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function isStaffMode(): boolean {
  return getStaffName() !== null
}
