"use strict";

// scripts/lib/referee-fakes.js: a request no option answers rejects, as
// fake-jquery.js's do, and every request is recorded either way.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { installRefereeFakes } = require("../scripts/lib/referee-fakes.js");

let fakes;

afterEach(() => {
  fakes.restore();
});

describe("referee-fakes", () => {
  it("rejects a listing for a path fileListByPath does not name", async () => {
    fakes = installRefereeFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/x.json"] },
    });

    assert.deepEqual(await global.api.file.list("/pa/ai/"), ["/pa/ai/x.json"]);
    await assert.rejects(
      global.api.file.list("/pa/ai_penchant/"),
      /no file listing configured for \/pa\/ai_penchant\//
    );
    assert.deepEqual(fakes.listCalls, ["/pa/ai/", "/pa/ai_penchant/"]);
  });

  it("rejects every listing and getJSON when neither is configured", async () => {
    fakes = installRefereeFakes();

    await assert.rejects(
      global.api.file.list("/pa/ai/"),
      /no file listing configured for \/pa\/ai\//
    );
    await assert.rejects(
      global.$.getJSON("coui://pa/ai/x.json"),
      /no getJSON resolver configured for coui:\/\/pa\/ai\/x\.json/
    );
    assert.deepEqual(fakes.listCalls, ["/pa/ai/"]);
    assert.deepEqual(fakes.getJSONCalls, ["coui://pa/ai/x.json"]);
  });

  it("answers from listFiles and getJSON when they are given", async () => {
    fakes = installRefereeFakes({
      listFiles: (path) => [path + "x.json"],
      getJSON: (url) => ({ from: url }),
    });

    assert.deepEqual(await global.api.file.list("/pa/ai_penchant/"), [
      "/pa/ai_penchant/x.json",
    ]);
    assert.deepEqual(await global.$.getJSON("coui://pa/ai_penchant/x.json"), {
      from: "coui://pa/ai_penchant/x.json",
    });
  });
});
