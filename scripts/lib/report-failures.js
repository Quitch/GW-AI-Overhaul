"use strict";

// The failure dumps shared by the validators. The contract validators accumulate
// `{ file, problems }`; the rest a flat list of problem strings. Both print the
// same way, so the format lives here rather than drifting between them.

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

function reportProblems(problems) {
  if (!problems.length) {
    return;
  }

  console.error("");
  for (const problem of problems) {
    console.error("  - " + problem);
  }
  process.exitCode = 1;
}

module.exports = { reportFailures, reportProblems };
