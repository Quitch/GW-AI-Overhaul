"use strict";

// The pure halves of gw_play/coop_ping_operators.js: what a host will accept
// and how often it will accept it. The handlers built around them are covered
// by coop_ping_factory.test.js, and the marker's frame maths - which lives in
// coop_ping_marker.js - by coop_ping_marker.test.js.
//
// Note that gw_play/coop_ping.js, the scene bootstrap, has no test of its own:
// it injects the button's HTML and calls requireGW, so there is nothing in it
// the Node harness can reach. See docs/testing.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const {
  clientKey,
  createCooldown,
  pingChatMessage,
  pingPlayerName,
  pingValidationError,
  starValidationError,
  techChoicePending,
} = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping_operators.js"
);

const ping = (extra) => Object.assign({ star: 1, ping_id: "p1" }, extra);

describe("ping validation", () => {
  it("accepts a ping naming a star in the galaxy", () => {
    assert.equal(pingValidationError(ping(), 3), undefined);
  });

  it("accepts both ends of the galaxy", () => {
    assert.equal(pingValidationError(ping({ star: 0 }), 3), undefined);
    assert.equal(pingValidationError(ping({ star: 2 }), 3), undefined);
  });

  it("refuses anything that is not a payload object", () => {
    for (const payload of [undefined, null, "star", 3, [], true]) {
      assert.equal(
        pingValidationError(payload, 3),
        "invalid payload",
        JSON.stringify(payload)
      );
    }
  });

  // A fractional or non-numeric index would address nothing, and the marker
  // would be raised on undefined.
  it("refuses a star that is not a whole number", () => {
    for (const star of ["1", null, undefined, NaN, Infinity, 1.5, -0.5]) {
      assert.equal(
        pingValidationError(ping({ star }), 3),
        "invalid star",
        String(star)
      );
    }
  });

  it("refuses a star outside the galaxy", () => {
    assert.equal(
      pingValidationError(ping({ star: 3 }), 3),
      "star out of range"
    );
    assert.equal(
      pingValidationError(ping({ star: -1 }), 3),
      "star out of range"
    );
    assert.equal(
      pingValidationError(ping({ star: 0 }), 0),
      "star out of range"
    );
  });

  // The host copies this string verbatim into a message sent to every client.
  it("refuses a missing, empty or oversized ping id", () => {
    for (const pingId of [undefined, null, 7, "", "x".repeat(65)]) {
      assert.equal(
        pingValidationError(ping({ ping_id: pingId }), 3),
        "invalid ping id",
        String(pingId)
      );
    }

    assert.equal(
      pingValidationError(ping({ ping_id: "x".repeat(64) }), 3),
      undefined
    );
  });
});

describe("star validation", () => {
  it("accepts a whole number inside the galaxy", () => {
    assert.equal(starValidationError(0, 3), undefined);
    assert.equal(starValidationError(2, 3), undefined);
  });

  it("refuses what a ping payload would also refuse", () => {
    assert.equal(starValidationError("1", 3), "invalid star");
    assert.equal(starValidationError(1.5, 3), "invalid star");
    assert.equal(starValidationError(-1, 3), "star out of range");
    assert.equal(starValidationError(3, 3), "star out of range");
  });
});

describe("an exploration still being resolved", () => {
  const offer = { pendingTechCards: { star: 2, cards: [] } };

  it("sees an offer anybody is still holding", () => {
    assert.equal(techChoicePending([offer]), true);
    assert.equal(techChoicePending([{}, undefined, offer]), true);
  });

  it("sees nothing in an empty or resolved set of records", () => {
    assert.equal(techChoicePending([]), false);
    assert.equal(techChoicePending(undefined), false);
    assert.equal(techChoicePending([{}, undefined]), false);
    assert.equal(techChoicePending([{ pendingTechCards: undefined }]), false);
  });

  // The same shape test gwCampaignPlayerSetupBlocked applies, so a half-written
  // record does not read as an open offer.
  it("ignores a record whose offer is malformed", () => {
    assert.equal(
      techChoicePending([{ pendingTechCards: { star: "2", cards: [] } }]),
      false
    );
    assert.equal(
      techChoicePending([{ pendingTechCards: { star: 2, cards: "a" } }]),
      false
    );
  });
});

describe("ping labelling", () => {
  it("names the system alongside the ping", () => {
    assert.equal(pingChatMessage("Sol"), "!LOC:Ping! Sol");
  });

  it("says the ping alone when the system has no name", () => {
    assert.equal(pingChatMessage(""), "!LOC:Ping!");
    assert.equal(pingChatMessage(undefined), "!LOC:Ping!");
  });

  it("labels a viewer the game never named", () => {
    assert.equal(pingPlayerName("Alice"), "Alice");
    assert.equal(pingPlayerName(""), "!LOC:Unknown");
    assert.equal(pingPlayerName(undefined), "!LOC:Unknown");
  });

  // An unauthenticated viewer has an empty client_id, so the name has to be
  // part of the key or every one of them shares a bucket.
  it("keys a client by id and name together", () => {
    assert.equal(clientKey("abc", "Alice"), "abc::Alice");
    assert.equal(clientKey(undefined, "Alice"), "::Alice");
    assert.equal(clientKey("abc", undefined), "abc::");
    assert.notEqual(clientKey("", "Alice"), clientKey("", "Bob"));
  });
});

describe("ping cooldown", () => {
  it("accepts one ping per client per limit", () => {
    const cooldown = createCooldown(2500);
    assert.equal(cooldown.allow("alice", 1000), true);
    assert.equal(cooldown.allow("alice", 3499), false);
    assert.equal(cooldown.allow("alice", 3500), true);
  });

  it("holds a client to its own bucket", () => {
    const cooldown = createCooldown(2500);
    assert.equal(cooldown.allow("alice", 1000), true);
    assert.equal(cooldown.allow("bob", 1000), true);
    assert.equal(cooldown.allow("alice", 1100), false);
  });

  // Pruning runs on every accept, so a bucket that is still holding somebody
  // off must survive one.
  it("does not prune a bucket that is still live", () => {
    const cooldown = createCooldown(2500);
    cooldown.allow("alice", 1000);
    cooldown.allow("bob", 2000);
    assert.equal(cooldown.allow("alice", 2001), false);
  });

  it("forgets a client that stopped pinging", () => {
    const cooldown = createCooldown(2500);
    cooldown.allow("alice", 0);
    cooldown.allow("bob", 60000);
    assert.equal(cooldown.allow("alice", 60001), true);
  });

  // Own properties only, or a client could name itself out of the limit.
  it("is not fooled by a client named after an Object member", () => {
    const cooldown = createCooldown(2500);
    assert.equal(cooldown.allow("__proto__", 1000), true);
    assert.equal(cooldown.allow("__proto__", 1100), false);
    assert.equal(cooldown.allow("constructor", 1000), true);
    assert.equal(cooldown.allow("constructor", 1100), false);
  });
});
