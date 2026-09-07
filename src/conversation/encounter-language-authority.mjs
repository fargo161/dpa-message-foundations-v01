/** Private issuer instances belong to validated scenario adapters, never HTTP clients.
 * A copied handle or a handle from another issuer cannot authorize language.
 * This is encounter-local authority; it makes no foundation TPL approval claim.
 */
export function createLanguageAuthority() {
  const issued = new WeakMap();
  return Object.freeze({
    issue(frame, context) {
      const record = structuredClone({ frame, context });
      const binding = Object.freeze({ kind: "encounter-language-authority@0.1" });
      issued.set(binding, record);
      return binding;
    },
    read(binding) {
      const record = binding && typeof binding === "object" ? issued.get(binding) : null;
      if (!record) throw new Error("Unissued or foreign encounter language binding.");
      return structuredClone(record);
    },
  });
}
