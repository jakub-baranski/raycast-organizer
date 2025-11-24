export function formatTimeInput(input: string): string {
  const val = input.replace(/\D/g, "");
  if (val.length === 4) {
    // e.g., 0830 -> 08:30
    const hour = parseInt(val.slice(0, 2), 10);
    const minute = parseInt(val.slice(2), 10);
    if (hour > 23 || minute > 59) return "";
    return `${val.slice(0, 2)}:${val.slice(2)}`;
  } else if (val.length === 3) {
    // e.g., 830 -> 08:30
    const hour = parseInt(val.slice(0, 1), 10);
    const minute = parseInt(val.slice(1), 10);
    if (hour > 23 || minute > 59) return "";
    return `0${val.slice(0, 1)}:${val.slice(1)}`;
  } else if (val.length === 2) {
    // e.g., 18 -> 18:00
    const hour = parseInt(val, 10);
    if (hour > 23) return "";
    return `${val}:00`;
  } else if (val.length === 1) {
    // e.g., 8 -> 08:00
    const hour = parseInt(val, 10);
    if (hour > 23) return "";
    return `0${val}:00`;
  }
  return "";
}
