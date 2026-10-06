"""Deterministic offline packaging of the canonical Marcus engine and existing UI.

Python 3.10+ standard library only. No source rewriting, downloads or output deletion.
"""
from pathlib import Path, PurePosixPath
import argparse
import base64
import hashlib
import json
import re
import sys
import os
import subprocess

VERSION = "marcus-world-model-standalone@0.1"
ENTRIES = ["src/conversation/runtime.mjs", "public/encounter/delivery-chart.js",
           "public/encounter/face-renderer.js", "public/encounter/turn-player.js"]
PUBLIC_IMPORTS = {"/delivery-options.mjs": "src/conversation/delivery-options.mjs",
                  "/r17-rates.mjs": "src/encounter/constants.mjs",
                  "/playtest-log.js": "public/encounter/playtest-log.js",
                  "/local-engine.mjs": "public/encounter/local-engine.mjs",
                  "/browser-options.mjs": "public/encounter/browser-options.mjs",
                  **{f"/{name}.js": f"public/encounter/{name}.js"
                     for name in ["delivery-chart", "face-renderer", "turn-player"]}}
BUILTINS = {"node:fs": {"readFileSync"}, "node:url": {"fileURLToPath"}}
IMPORT = re.compile(r"^[ \t]*import\s+([^;\n]+?)\s+from\s+['\"]([^'\"]+)['\"];?[ \t]*$", re.M)
SIDE_IMPORT = re.compile(r"^[ \t]*import\s+['\"]([^'\"]+)['\"];?[ \t]*$", re.M)
REEXPORT = re.compile(r"^[ \t]*export\s*\{([^}\n]+)\}\s*from\s*['\"]([^'\"]+)['\"];?[ \t]*$", re.M)
DECL = re.compile(r"^[ \t]*export\s+((?:async\s+)?function|const|let|var|class)\s+(\w+)", re.M)
EXPORT_LIST = re.compile(r"^[ \t]*export\s*\{([^}\n]+)\}\s*;?[ \t]*$", re.M)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def js(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def checked_replace(text, old, new, count, label, receipts):
    actual = text.count(old)
    if actual != count:
        raise ValueError(f"Substitution contract failed: {label}: expected {count}, found {actual}")
    receipts.append({"label": label, "expected": count, "actual": actual})
    return text.replace(old, new)


def bindings(inner):
    pairs = []
    for item in inner.split(","):
        if not item.strip():
            continue
        match = re.fullmatch(r"\s*(\w+)(?:\s+as\s+(\w+))?\s*", item)
        if not match:
            raise ValueError(f"Unsupported binding: {item}")
        pairs.append((match[1], match[2] or match[1]))
    return pairs


def imported_names(clause):
    if clause.startswith("{") and clause.endswith("}"):
        return bindings(clause[1:-1])
    if re.fullmatch(r"\*\s+as\s+\w+", clause):
        return []
    raise ValueError(f"Unsupported import clause: {clause}")


def resolve(current, spec):
    if spec.startswith("node:"):
        if current != "src/based.mjs" or spec not in BUILTINS:
            raise ValueError(f"Unapproved Node builtin {spec} in {current}")
        return spec
    if spec.startswith("/"):
        if spec not in PUBLIC_IMPORTS:
            raise ValueError(f"Unsupported public import {spec} in {current}")
        return PUBLIC_IMPORTS[spec]
    if not spec.startswith(".") or "\\" in spec:
        raise ValueError(f"Unresolved external import {spec} in {current}")
    parts = list(PurePosixPath(current).parent.parts)
    for part in spec.split("/"):
        if part in ["", "."]:
            continue
        if part == "..":
            if not parts:
                raise ValueError(f"Import escapes source root: {spec}")
            parts.pop()
        else:
            parts.append(part)
    path = "/".join(parts)
    if not PurePosixPath(path).suffix:
        path += ".mjs"
    return path


class Bundle:
    def __init__(self, source):
        self.source = source.resolve()
        self.sources = {}
        self.inputs = {}
        self.receipts = []
        self.edges = []

    def read(self, name):
        path = (self.source / name).resolve()
        if not path.is_relative_to(self.source) or not path.is_file():
            raise ValueError(f"Missing or escaped required source: {name}")
        text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        encoded = text.encode("utf-8")
        self.inputs[name] = {"path": name, "bytes": len(encoded), "sha256": digest(encoded), "encoding": "UTF-8/LF"}
        return text

    def collect(self, name):
        if name.startswith("node:") or name in self.sources:
            return
        text = self.read(name)
        self.sources[name] = text
        for pattern, spec_group in [(IMPORT, 2), (SIDE_IMPORT, 1), (REEXPORT, 2)]:
            for match in pattern.finditer(text):
                target = resolve(name, match[spec_group])
                self.edges.append({"from": name, "to": target, "kind": "reexport" if pattern is REEXPORT else "import"})
                self.collect(target)

    def export_names(self, name):
        if name in BUILTINS:
            return BUILTINS[name]
        text = self.sources[name]
        result = {match[2] for match in DECL.finditer(text)}
        for pattern in [REEXPORT, EXPORT_LIST]:
            for match in pattern.finditer(text):
                result.update(alias for _, alias in bindings(match[1]))
        return result

    def import_code(self, path, clause, spec):
        target = resolve(path, spec)
        for name, _ in imported_names(clause):
            if name not in self.export_names(target):
                raise ValueError(f"Unresolved imported binding {name} from {target} in {path}")
        if clause.startswith("{"):
            fields = ", ".join(name if name == alias else f"{name}: {alias}" for name, alias in bindings(clause[1:-1]))
            return f"const {{ {fields} }} = __req({js(target)});"
        alias = re.fullmatch(r"\*\s+as\s+(\w+)", clause)[1]
        return f"const {alias} = __req({js(target)});"

    def transform(self, path, text, export_module=True):
        exports = []
        text = IMPORT.sub(lambda m: self.import_code(path, m[1].strip(), m[2]), text)
        text = SIDE_IMPORT.sub(lambda m: f"__req({js(resolve(path, m[1]))});", text)

        def reexport(match):
            target = resolve(path, match[2])
            fields = []
            for name, alias in bindings(match[1]):
                if name not in self.export_names(target):
                    raise ValueError(f"Unresolved reexport {name} from {target} in {path}")
                local = "__reexport_" + alias
                fields.append(f"{name}: {local}")
                exports.append((alias, local))
            return f"const {{ {', '.join(fields)} }} = __req({js(target)});"

        text = REEXPORT.sub(reexport, text)

        def declaration(match):
            exports.append((match[2], match[2]))
            return f"{match[1]} {match[2]}"

        text = DECL.sub(declaration, text)

        def export_list(match):
            exports.extend((alias, name) for name, alias in bindings(match[1]))
            return ""

        text = EXPORT_LIST.sub(export_list, text)
        if path == "src/based.mjs":
            text = checked_replace(text, "import.meta.url", '"file:///standalone/src/based.mjs"', 1, "unused Node authored-anchor URL", self.receipts)
        if re.search(r"^[ \t]*(?:import|export)\b|\bimport\s*\(|\bimport\.meta\b", text, re.M):
            raise ValueError(f"Unsupported residual module syntax: {path}")
        if export_module:
            text += "\nObject.assign(module.exports, {" + ",".join(f"{js(alias)}:{name}" for alias, name in exports) + "});\n"
        elif exports:
            raise ValueError("Unexpected browser app export")
        return text


REGISTRY = r'''
// BEGIN_MARCUS_MODULE_REGISTRY
const __mods = Object.create(null), __cache = Object.create(null);
__mods["node:fs"] = function(__req,module,exports){ exports.readFileSync = function(){ throw new Error("Filesystem corpus loading is not used by the standalone encounter."); }; };
__mods["node:url"] = function(__req,module,exports){ exports.fileURLToPath = function(x){ return String(x); }; };
function __req(id){
  if(__cache[id]) return __cache[id].exports;
  const fn=__mods[id]; if(!fn) throw new Error("Standalone module not found: "+id);
  const module={exports:{}}; __cache[id]=module; fn(__req,module,module.exports); return module.exports;
}
'''


def audit_no_network(script, html, css):
    if re.search(r"\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(|\bsendBeacon\s*\(|\bimport\s*\(", script):
        raise ValueError("Residual network-capable call in generated script")
    for url in re.findall(r"https?://[^\s'\"`<>]+", script):
        if url != "http://www.w3.org/2000/svg":
            raise ValueError(f"Residual remote URL: {url}")
    if re.search(r"<(?:script|link|img|iframe|video|audio|source)\b[^>]*(?:src|href)\s*=", html, re.I):
        raise ValueError("Residual external HTML resource reference")
    if re.search(r"@import\b|url\s*\(\s*['\"]?(?!data:|#)", css, re.I):
        raise ValueError("Residual external CSS resource reference")


def build(source, output):
    bundle = Bundle(source)
    for entry in ENTRIES:
        bundle.collect(entry)
    bundle.collect("public/encounter/app.js")
    bundle.collect("src/playtest/recorder.mjs")
    bundle.collect("src/playtest/markdown.mjs")
    package = json.loads(bundle.read("package.json"))
    supplied = os.environ.get("MARCUS_BUILD_INFO")
    build_info = json.loads(supplied) if supplied else {"mode": "standalone", "packageName": package["name"], "packageVersion": package["version"], "commitFull": None, "commitShort": None, "dirty": None}
    if not supplied:
        try:
            sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=source, stderr=subprocess.DEVNULL, text=True).strip()
            if re.fullmatch(r"[a-f0-9]{40}", sha):
                build_info.update(commitFull=sha, commitShort=sha[:7], dirty=bool(subprocess.check_output(["git", "status", "--porcelain"], cwd=source, stderr=subprocess.DEVNULL, text=True).strip()))
        except (OSError, subprocess.CalledProcessError):
            pass
    build_info = {key: build_info.get(key) for key in ["mode", "packageName", "packageVersion", "commitFull", "commitShort", "dirty"]}
    definitions = []
    for path in sorted(bundle.sources):
        if path == "public/encounter/app.js":
            continue
        text = bundle.sources[path]
        if path == "public/encounter/face-renderer.js":
            text = checked_replace(text, r'if (!asset || !/^\/assets\/marcus\/[a-zA-Z0-9_-]+\.webp$/.test(asset.src)) return;',
                                   r'if (!asset || !/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(asset.src)) return;', 1, "embedded face image guard", bundle.receipts)
        transformed = bundle.transform(path, text)
        definitions.append(f"__mods[{js(path)}] = function(__req,module,exports){{\n{transformed}\n}};")
    catalog = bundle.sources["src/conversation/face/catalog.mjs"]
    required_assets = sorted(set(re.findall(r'"src"\s*:\s*"(/assets/marcus/[a-zA-Z0-9_-]+\.webp)"', catalog)))
    if len(required_assets) != 28:
        raise ValueError(f"Asset contract requires 28 referenced WEBP files, found {len(required_assets)}")
    assets, asset_receipts = {}, []
    for url in required_assets:
        path = (source / "public/encounter" / url.lstrip("/")).resolve()
        if not path.is_relative_to(source.resolve()) or not path.is_file():
            raise ValueError(f"Missing required face asset: {url}")
        data = path.read_bytes()
        if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            raise ValueError(f"Invalid WEBP face asset: {url}")
        assets[url] = "data:image/webp;base64," + base64.b64encode(data).decode("ascii")
        asset_receipts.append({"path": "public/encounter" + url, "bytes": len(data), "sha256": digest(data)})
    app = bundle.sources["public/encounter/app.js"]
    if len(list(IMPORT.finditer(app))) != 7:
        raise ValueError("Browser app import contract expected seven imports")
    app = bundle.transform("public/encounter/app.js", app, export_module=False)
    index = bundle.read("public/encounter/index.html")
    index = checked_replace(index, '<script type="importmap">{"imports":{"node:fs":"/browser-node-fs.mjs","node:url":"/browser-node-url.mjs"}}</script>', '', 1, 'remove browser import map', bundle.receipts)
    index = checked_replace(index, '<script src="/build-info.js"></script>', '', 1, 'remove dev metadata script', bundle.receipts)
    css = bundle.read("public/encounter/style.css") + "\n" + bundle.read("public/encounter/delivery-chart.css")
    if re.search(r"</style", css, re.I):
        raise ValueError("Unexpected style closing token in CSS")
    index = checked_replace(index, '<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/delivery-chart.css">', '<style>' + css + '</style>', 1, 'inline CSS', bundle.receipts)
    index = checked_replace(index, '<script type="module" src="/app.js"></script>', '', 1, 'remove module script transport', bundle.receipts)
    runtime = REGISTRY + "\n".join(definitions) + "\n// END_MARCUS_MODULE_REGISTRY\n"
    runtime += "globalThis.__MARCUS_ASSET_DATA = " + js(assets) + ";\nconst __MARCUS_BUILD_INFO = " + js(build_info) + ";\n" + "globalThis.__MARCUS_BUILD_INFO = __MARCUS_BUILD_INFO;\n"
    script = runtime + "\n// BEGIN_MARCUS_EXISTING_UI\n" + app + "\n// END_MARCUS_EXISTING_UI\n"
    audit_no_network(script, index, css)
    script = re.sub(r"</script", r"<\/script", script, flags=re.I)
    badge = '<div id="offline-build-badge" style="position:fixed;right:10px;bottom:8px;z-index:9999;background:#101923dd;border:1px solid #405266;color:#94a7b8;padding:5px 8px;border-radius:5px;font:10px Segoe UI,sans-serif;pointer-events:none">STANDALONE · OFFLINE · WORLD MODEL V01</div>'
    index = checked_replace(index, '</body>', badge + '\n<script>\n' + script + '\n</script>\n</body>', 1, 'inline script', bundle.receipts)
    html_bytes = index.encode("utf-8")
    inventory = {"schemaVersion": VERSION, "html": {"path": "Marcus_Encounter.html", "bytes": len(html_bytes), "sha256": digest(html_bytes)},
                 "sourceEncoding": "UTF-8 normalized to LF before hashing and embedding", "modules": sorted(bundle.sources), "buildInfo": build_info,
                 "moduleGraph": sorted(bundle.edges, key=lambda edge: (edge["from"], edge["to"], edge["kind"])),
                 "sourceInputs": [bundle.inputs[name] for name in sorted(bundle.inputs)], "assets": asset_receipts,
                 "nodeStubAllowlist": {name: sorted(exports) for name, exports in BUILTINS.items()},
                 "substitutions": bundle.receipts, "networkAudit": "PASS: no transport calls or external resources",
                 "execution": {"engine": "public/encounter/local-engine.mjs", "state": "page-local volatile", "languageMode": "AUTHORING_PREVIEW"}}
    inventory_bytes = (json.dumps(inventory, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
    # All validations complete before either deliverable is touched. No recursive deletion.
    output.mkdir(parents=True, exist_ok=True)
    (output / "Marcus_Encounter.html").write_bytes(html_bytes)
    (output / "BUILD_INVENTORY.json").write_bytes(inventory_bytes)
    return inventory


def main(argv=None):
    root = Path(__file__).resolve().parents[1]
    default_source = root / "source" if (root / "source/src").is_dir() else root
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=default_source, help="Canonical source root (default: sibling source/ or repository root)")
    parser.add_argument("--output", type=Path, default=root if default_source != root else root / "dist/standalone", help="Directory for HTML and inventory")
    args = parser.parse_args(argv)
    try:
        result = build(args.source.resolve(), args.output.resolve())
    except (ValueError, OSError, UnicodeError) as error:
        print(f"Standalone build FAILED: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"status": "PASS", "modules": len(result["modules"]), "assets": len(result["assets"]), **result["html"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
