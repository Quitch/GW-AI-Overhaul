"use strict";

// scripts/lib/write-text.js: generated text keeps the line ending the file
// already has.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { writeText } = require("../scripts/lib/write-text.js");

describe("writeText", () => {
  let dir;
  let file;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-write-text-"));
    file = path.join(dir, "out.json");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const read = () => fs.readFileSync(file, "utf8");

  it("writes a new file with LF", () => {
    writeText(file, "{\r\n  a: 1\n}\n");
    assert.equal(read(), "{\n  a: 1\n}\n");
  });

  it("keeps CRLF in a CRLF file", () => {
    fs.writeFileSync(file, "{}\r\n");
    writeText(file, "{\n  a: 1\n}\n");
    assert.equal(read(), "{\r\n  a: 1\r\n}\r\n");
  });

  it("keeps LF in an LF file", () => {
    fs.writeFileSync(file, "{}\n");
    writeText(file, "{\r\n  a: 1\r\n}\r\n");
    assert.equal(read(), "{\n  a: 1\n}\n");
  });

  it("writes LF over a file with no line break", () => {
    fs.writeFileSync(file, "{}");
    writeText(file, "{\n}\n");
    assert.equal(read(), "{\n}\n");
  });

  for (const existing of ["{\r\n}\r\n", "{\n}\n"]) {
    it("leaves an unchanged " + JSON.stringify(existing) + " alone", () => {
      fs.writeFileSync(file, existing);
      const old = new Date(2000, 0, 1);
      fs.utimesSync(file, old, old);
      writeText(file, "{\n}\n");
      assert.equal(fs.statSync(file).mtimeMs, old.getTime());
    });
  }
});
