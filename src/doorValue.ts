// Værdien er ens for begge hold; det er forskelsleddet, der giver holdet bagud en chance for at vende kampen.
export function doorValue(
  base: number,
  opened: number,
  doorCount: number,
  gap: number,
  roll: number
): number {
  const step = base * (1 + Math.floor((opened * 3) / doorCount));
  const unit = base / 2;
  return Math.max(step, Math.ceil((gap * (0.3 + roll * 0.8)) / unit) * unit);
}

export function formatPoints(points: number): string {
  const digits = Math.abs(points).toLocaleString("da-DK");
  return points < 0 ? `−${digits}` : digits;
}
