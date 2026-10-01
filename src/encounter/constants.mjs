export const PRICE = 60;

// Percentage points avoid floating-point drift at whole-dollar boundaries.
export const R17_EXTRA_CHARGE = Object.freeze({ NORMAL: 16, SHOW_GOODWILL: 3, BLIND_TRADE_PENALTY: 6, TRADE_SUCCESS: 8 });

export function resolveR17Rate({ shown = false, blindTradeFailed = false, available = false, includesInformation = false, cares = false } = {}) {
  const ordinary = R17_EXTRA_CHARGE.NORMAL - (shown ? R17_EXTRA_CHARGE.SHOW_GOODWILL : 0)
    + (blindTradeFailed ? R17_EXTRA_CHARGE.BLIND_TRADE_PENALTY : 0);
  return available && includesInformation && cares && !blindTradeFailed ? R17_EXTRA_CHARGE.TRADE_SUCCESS : ordinary;
}

export function r17ExtraFloor(principal, rate) {
  if (!Number.isSafeInteger(principal) || principal < 0 || !Number.isSafeInteger(rate) || rate < 0) throw new Error("Invalid R-17 fee inputs.");
  return Math.ceil(principal * rate / 100);
}

/** Public draft possibilities only. Never accepts an NPC attitude or belief. */
export function r17DraftCharges(principal, player = {}, includesInformation = false) {
  const persistent = resolveR17Rate(player);
  let rates = [persistent];
  if (includesInformation && player.available && !player.blindTradeFailed) {
    rates = player.interestKnown
      ? [resolveR17Rate({ ...player, includesInformation: true, cares: player.knownMarcusInterest === true })]
      : [R17_EXTRA_CHARGE.TRADE_SUCCESS, resolveR17Rate({ ...player, blindTradeFailed: true })];
  }
  return rates.map(rate => ({ rate, extra: r17ExtraFloor(principal, rate) }));
}

export function r17StandardExtra(principal) { return r17ExtraFloor(principal, R17_EXTRA_CHARGE.NORMAL); }
