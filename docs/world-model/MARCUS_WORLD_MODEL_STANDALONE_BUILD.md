# Marcus world-model standalone build

The distributable `Marcus_Encounter.html` runs the canonical world-backed encounter modules and the existing browser UI. It embeds the two existing stylesheets and all 28 face assets referenced by the catalog. It contains no second rules engine and loads no external runtime dependencies.

## Rebuild

Python 3.10 or newer is the only build-tool dependency; the builder uses its standard library. Normal play does not require Python, Node, a server, installation, or internet access.

From the source repository:

```text
python tools/build_standalone.py --source . --output path/to/standalone
```

`tools/rebuild_standalone.py` calls the identical implementation and accepts the same options. A packaged layout with `tools/` and `source/` beside the HTML can run `python tools/rebuild_standalone.py` without options: it discovers the sibling `source/` and writes the HTML and inventory beside it. Within a repository, the default source is the repository root and the default output is `dist/standalone/`. Explicit paths work from any current directory.

The delivered package keeps its canonical build tools in `source/tools/`. From the folder containing the HTML, use `python source/tools/rebuild_standalone.py --source source --output .`. The wrapper suppresses Python bytecode-cache creation in the shipped source.

The builder writes only `Marcus_Encounter.html` and `BUILD_INVENTORY.json`. It does not delete the output directory, copy a repository, create a ZIP, install packages, or download materials. All validation completes before these two output files are replaced. Unrelated output files remain untouched.

## Reproducibility and failure gates

Input text is normalized to UTF-8/LF. Modules, assets, graph edges, and inventory records have stable ordering. The output contains no build timestamp or absolute host path. The inventory records normalized source hashes, asset byte hashes, the complete import/reexport graph, exact substitution counts, the two allowed Node stubs, and the HTML hash and size.

The restricted source-to-registry packager supports the import/export forms used by this repository, including named reexports. It rejects unresolved modules or imported/reexported bindings, unsupported residual ESM syntax, external imports, and unapproved Node builtins. Only the unused authored-anchor loader's `node:fs` and `node:url` imports in `src/based.mjs` have stubs; filesystem loading throws if called. Its single `import.meta.url` expression gets a checked synthetic base.

Every transport, UUID, renderer, HTML, and CSS substitution has an exact expected count. All 28 catalog assets must exist and contain WEBP headers. Generated scripts must have no remaining network-capable call; generated HTML/CSS must have no external resource dependency. The SVG namespace URI is an identifier, not a fetched asset, and is the sole allowed HTTP URI.

Dedicated packaging gate, separate from the Node-only portable suite:

```text
node --test tests/standalone-build.test.mjs
```

Set `MARCUS_PYTHON` to a Python executable path if it is not available as `python`. These tests compare two builds byte-for-byte, rebuild from a relocated `source/` package, parse the complete script, compare a seeded state to the canonical engine, and inject missing assets, substitution drift, unresolved reexports/bindings, forbidden builtins, and network calls. Failure tests retain a previous output sentinel. Scratch builds remain under the operating system's temporary `marcus-standalone-builder-checks/` directory, or an explicit `MARCUS_STANDALONE_WORK` directory.

Independent bundle verification replays the frozen 23 routes / 127 snapshots against the modules extracted from the generated HTML. Stable extraction markers are `BEGIN_MARCUS_MODULE_REGISTRY`, `END_MARCUS_MODULE_REGISTRY`, `BEGIN_MARCUS_LOCAL_API`, `END_MARCUS_LOCAL_API`, and `BEGIN_MARCUS_EXISTING_UI`. The registry's existing `__mods`, `__req`, and `__localState` bindings remain accessible to a VM verifier; no gameplay test override is added.

## Transport differences and scope

The existing `/api/state`, `/api/preview`, `/api/turn`, and `/api/restart` calls use an in-page adapter. Engine validation, world event commits, perceptions, beliefs, offers, economics, and faces come from the same source graph as the HTTP version. The page retains `AUTHORING_PREVIEW`, matching the supplied standalone and frozen oracle.

The standalone has page-local volatile state, a fixed `LOCAL-OFFLINE` CSRF marker, and local run IDs and default seeds. It does not reproduce HTTP cookies, cross-session isolation, server request-replay tracking, or transport-level restart checks. Explicit-seed engine behavior is checked independently; those transport properties are not claimed equivalent. Face catalog paths are replaced with embedded data URLs in detached presentation snapshots, with a checked renderer guard. The small offline badge is packaging presentation.

Reloading or closing the page ends the current run. This milestone adds no save/load format, native executable, installer, or hosted service. A future executable can package the same engine and world ledger; generated HTML is a distributable, while the source tree remains the editable authority.

Actual file-launch and visual behavior require a browser check. VM parity, script parsing, asset completeness, and absence of network dependencies do not certify browser rendering or a particular browser's `file://` behavior. The final handoff reports separately which browser checks were possible.
