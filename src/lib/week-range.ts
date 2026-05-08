/** Začátek dne v lokálním čase (server = prostředí běhu; na Vercelu typicky UTC). */
export function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Posledních `days` dní včetně dneška: [from, to] jako ISO začátek/konec dne. */
export function rollingDaysRange(days: number) {
  const to = startOfLocalDay(new Date());
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  return { from, to: toEnd };
}
