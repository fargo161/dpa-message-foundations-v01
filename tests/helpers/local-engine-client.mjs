import { createLocalEngine } from "../../public/encounter/local-engine.mjs";
import { createEncounterServer } from "../../scripts/encounter-server.mjs";

// Capture actual engine outcomes. `code` is the existing EncounterError code,
// not an HTTP response. JSON normalization preserves the old submitted inputs.
export async function invokeEngine(engine, method, input) {
  try { return { code: 0, value: engine[method](JSON.parse(JSON.stringify(input))) }; }
  catch (error) { return { code: error.status ?? 500, value: { error: error.message }, error }; }
}
export function localClient() {
  const engine = createLocalEngine();
  return { engine, view: engine.getState() };
}
export async function serveStatic(t) {
  const server = createEncounterServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  return `http://127.0.0.1:${server.address().port}`;
}
