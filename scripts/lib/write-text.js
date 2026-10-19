"use strict";

// Writes generated text in the line ending the file already has. Under
// core.autocrlf the working copy is CRLF, and an LF rewrite of unchanged
// content is still listed by `git status`.

const fs = require("node:fs");

function usesCrlf(text) {
  const newline = text.indexOf("\n");
  return newline > 0 && text[newline - 1] === "\r";
}

function writeText(file, text) {
  const previous = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8")
    : undefined;
  const lf = text.replace(/\r\n/g, "\n");
  const out =
    previous !== undefined && usesCrlf(previous)
      ? lf.replace(/\n/g, "\r\n")
      : lf;
  if (out !== previous) {
    fs.writeFileSync(file, out);
  }
}

module.exports = { writeText };
