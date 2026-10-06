/** Browser capabilities supplied to the environment-independent local engine. @param {any} win */
export function createBrowserOptions(win = globalThis) {
  let storage = null, serial = 0;
  try { storage = win.localStorage; } catch { console.warn("Playtest storage unavailable."); }
  const clock = () => win.Date.now();
  return { storage, clock, build: win.__MARCUS_BUILD_INFO ?? { mode: "dev-page", packageVersion: "0.1.0" },
    generateId: () => win.crypto?.randomUUID?.() ?? `${clock().toString(36)}-${++serial}-${win.Math.random().toString(36).slice(2)}`,
    generateSeed: () => `local-${clock().toString(36)}-${++serial}`,
    assetSource(src) {
      const assets = win.__MARCUS_ASSET_DATA;
      if (!assets) return src;
      if (!assets[src]) throw new Error("Missing embedded face asset");
      return assets[src];
    } };
}
