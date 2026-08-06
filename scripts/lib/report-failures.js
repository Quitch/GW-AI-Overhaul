"use strict";

// The per-file failure dump shared by the contract validators. Both accumulate
// `{ file, problems }` and print it the same way, so the format lives here rather
// than drifting between them.

function reportFailures(failures) {
  if (!failures.length) {
    return;
  }

  console.error("");
  for (const failure of failures) {
    console.error(failure.file + ":");
    for (const problem of failure.problems) {
      console.error("  - " + problem);
    }
  }
  process.exitCode = 1;
}

module.exports = { reportFailures };
