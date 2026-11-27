// Founding VIP: anyone whose monthly support started before the end of
// 2026 (Eastern time) gets the Founding VIP badge for as long as they stay
// subscribed. Change this date to move the deadline.
export const FOUNDING_DEADLINE_MS = Date.parse("2027-01-01T05:00:00Z"); // Jan 1, 2027 at midnight ET

export function isFoundingTs(ts: number | undefined): boolean {
  return typeof ts === "number" && ts > 0 && ts < FOUNDING_DEADLINE_MS;
}

// A supporter is founding if Jackie set it by hand in the admin, otherwise
// if they signed up before the deadline.
export function supporterIsFounding(s: { ts: number; founding?: boolean }): boolean {
  return typeof s.founding === "boolean" ? s.founding : isFoundingTs(s.ts);
}
