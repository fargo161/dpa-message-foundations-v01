export default [{
  files: ["src/**/*.mjs", "scripts/**/*.mjs", "public/encounter/**/*.js"],
  ignores: ["data/**", ".cache/**"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: Object.fromEntries(["AbortSignal", "Buffer", "URL", "console", "fetch", "global", "process", "structuredClone", "document", "Node", "crypto"].map((name) => [name, "readonly"])),
  },
  rules: {
    "no-undef": "error",
    "no-dupe-keys": "error",
    "no-redeclare": "error",
    "no-unreachable": "error",
    "no-constant-condition": "error",
  },
}];
