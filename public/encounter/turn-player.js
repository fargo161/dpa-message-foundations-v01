// Presentation only: a committed turn already contains both faces and all effects.
export function createTurnPlayer({ onReceiving, onResponding, onFinish, reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true, delay = 1050 }) {
  let active = null;
  function finish(showResponse) {
    if (!active) return;
    const current = active; active = null; globalThis.clearTimeout(current.timer);
    if (showResponse) { onResponding(current.event); onFinish(current.event); }
    current.resolve(showResponse);
  }
  return {
    play(event, { manual = false } = {}) {
      finish(false);
      return new Promise(resolve => {
        active = { event, resolve, timer: null }; onReceiving(event);
        if (!manual) active.timer = globalThis.setTimeout(() => finish(true), reducedMotion() ? 180 : delay);
      });
    },
    skip() { finish(true); }, cancel() { finish(false); },
    get playing() { return active !== null; },
  };
}
