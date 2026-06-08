export function titleFromType(value: string): string {
  return value
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

export function targetSummary(value: string | number | bigint | null): string {
  const count = Number(value ?? 0);
  return count === 1 ? "1 target" : `${count} targets`;
}
