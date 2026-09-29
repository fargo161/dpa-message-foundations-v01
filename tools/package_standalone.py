"""Create a deterministic ZIP of an assembled Marcus standalone folder."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    folder, output = args.folder.resolve(), args.output.resolve()
    if not folder.is_dir() or not (folder / "Marcus_Encounter.html").is_file():
        raise SystemExit("Missing assembled standalone folder or Marcus_Encounter.html")
    if output.is_relative_to(folder):
        raise SystemExit("ZIP output must be outside the input folder")
    files = sorted(path for path in folder.rglob("*") if path.is_file())
    for path in files:
        if path.is_symlink() or not path.resolve().is_relative_to(folder):
            raise SystemExit(f"Refusing linked/outside package input: {path}")
        if any(part in {".git", "node_modules", "__pycache__"} for part in path.relative_to(folder).parts):
            raise SystemExit(f"Unexpected development cache in package: {path}")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            name = "Marcus_World_Model_Standalone_V01/" + path.relative_to(folder).as_posix()
            info = zipfile.ZipInfo(name, date_time=(2026, 9, 29, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    raw = output.read_bytes()
    print(json.dumps({"status": "PASS", "files": len(files), "bytes": len(raw),
                      "sha256": hashlib.sha256(raw).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    main()
