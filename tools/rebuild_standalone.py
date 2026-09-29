"""Rebuild with the same implementation; accepts --source and --output."""
import sys
sys.dont_write_bytecode = True
from build_standalone import main

if __name__ == "__main__":
    raise SystemExit(main())
