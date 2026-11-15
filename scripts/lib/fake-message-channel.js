"use strict";

// gwo_promise.js's soon() posts to a MessageChannel it makes on first use and
// keeps. Node's real one holds the event loop open once a port has an
// onmessage, so a test file using it never exits. The stand-in queues each
// message, and the test delivers them with deliver(). With `auto`, each
// message is delivered by setImmediate instead, for a test that only needs
// soon() to run its function later.
function installFakeMessageChannel(setGlobal, options) {
  const auto = !!(options && options.auto);
  const posted = [];
  setGlobal("MessageChannel", function FakeMessageChannel() {
    const port1 = {};
    this.port1 = port1;
    this.port2 = {
      postMessage: () => {
        if (auto) {
          setImmediate(() => port1.onmessage());
        } else {
          posted.push(() => port1.onmessage());
        }
      },
    };
  });

  return {
    posted,
    deliver: () => posted.shift()(),
  };
}

module.exports = { installFakeMessageChannel };
