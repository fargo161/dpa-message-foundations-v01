// The encounter never loads authored corpora from a browser filesystem.
export function readFileSync() { throw new Error("Filesystem corpus loading is not used by the browser encounter."); }
