"use strict";

// A minimal reader for the PA mod zips in download/: the central directory
// listing and per-entry extraction (stored or deflate). Enough for the
// harvest scripts; no dependency on a zip library.

const fs = require("node:fs");
const zlib = require("node:zlib");

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 0x10000 - 22);
  for (let i = buffer.length - 22; i >= min; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) {
      return i;
    }
  }
  throw new Error("zip-read: no end-of-central-directory record");
}

class ZipReader {
  constructor(filePath) {
    this.buffer = fs.readFileSync(filePath);
    this.entries = new Map();
    const eocd = findEocd(this.buffer);
    const count = this.buffer.readUInt16LE(eocd + 10);
    let offset = this.buffer.readUInt32LE(eocd + 16);
    for (let i = 0; i < count; i++) {
      if (this.buffer.readUInt32LE(offset) !== CEN_SIG) {
        throw new Error("zip-read: bad central directory entry");
      }
      const method = this.buffer.readUInt16LE(offset + 10);
      const compressedSize = this.buffer.readUInt32LE(offset + 20);
      const nameLength = this.buffer.readUInt16LE(offset + 28);
      const extraLength = this.buffer.readUInt16LE(offset + 30);
      const commentLength = this.buffer.readUInt16LE(offset + 32);
      const localOffset = this.buffer.readUInt32LE(offset + 42);
      const name = this.buffer.toString(
        "utf8",
        offset + 46,
        offset + 46 + nameLength
      );
      this.entries.set(name, { method, compressedSize, localOffset });
      offset += 46 + nameLength + extraLength + commentLength;
    }
  }

  names() {
    return [...this.entries.keys()];
  }

  has(name) {
    return this.entries.has(name);
  }

  read(name) {
    const entry = this.entries.get(name);
    if (!entry) {
      return undefined;
    }
    const local = entry.localOffset;
    if (this.buffer.readUInt32LE(local) !== LOC_SIG) {
      throw new Error("zip-read: bad local header for " + name);
    }
    const nameLength = this.buffer.readUInt16LE(local + 26);
    const extraLength = this.buffer.readUInt16LE(local + 28);
    const start = local + 30 + nameLength + extraLength;
    const data = this.buffer.subarray(start, start + entry.compressedSize);
    if (entry.method === 0) {
      return Buffer.from(data);
    }
    if (entry.method === 8) {
      return zlib.inflateRawSync(data);
    }
    throw new Error("zip-read: unsupported method " + entry.method);
  }

  readJson(name) {
    const data = this.read(name);
    return data === undefined ? undefined : JSON.parse(data.toString("utf8"));
  }
}

module.exports = { ZipReader };
