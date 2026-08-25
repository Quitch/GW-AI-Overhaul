"use strict";

// Shared stand-ins for the co-op card factories: a connected viewer, its
// inventory record, the GWInventory the factories load a record's saved cards
// into, and the rejection reader their host handlers need.

function viewer(id, extra) {
  return Object.assign({ id, name: id, role: "viewer" }, extra);
}

function record(id, extra) {
  return Object.assign({ id, inventory: { cards: [] } }, extra);
}

// A minimal stand-in for the base game's GWInventory: the factories only load a
// record's saved cards, count them, and apply them. `withHand` adds the hand-size
// answers the per-player deal weighs an offer on; `onApply` sees the instance as
// it is applied.
function inventoryClass(options) {
  const opts = options || {};
  return function GWInventory() {
    let loaded = [];
    let limit = 0;
    this.load = (data) => {
      loaded = (data && data.cards) || [];
      limit = (data && data.maxCards) || 0;
    };
    this.cards = () => loaded;
    if (opts.withHand) {
      this.handIsFull = () => loaded.length >= limit;
      this.hasCard = (id) => loaded.some((card) => card.id === id);
    }
    this.applyCards = (done) => {
      if (opts.onApply) {
        opts.onApply(this);
      }
      done();
    };
  };
}

// The host handlers and deferreds reject with a plain string, which
// `assert.rejects` will not take as an error, so the reason is captured instead.
async function rejection(promise) {
  try {
    await promise;
  } catch (reason) {
    return reason;
  }
  return undefined;
}

module.exports = { inventoryClass, record, rejection, viewer };
