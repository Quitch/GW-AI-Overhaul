"use strict";

// gwo_promise.js's soon() posts to a MessageChannel it makes on first use and
// keeps. Node's real one holds the event loop open once a port has an
// onmessage, so a test file using it never exits. The stand-in queues each
// message, and the test delivers them with deliver(). With `auto`, each
// message is delivered by setImmediate instead, for a test that only needs
// soon() to run its function later; setAuto() switches between the two.
// counts.sent counts every message.
function installFakeMessageChannel(setGlobal, options) {
  const mode = { auto: !!(options && options.auto) };
  const posted = [];
  const counts = { sent: 0 };
  setGlobal("MessageChannel", function FakeMessageChannel() {
    const port1 = {};
    this.port1 = port1;
    this.port2 = {
      postMessage: () => {
        counts.sent += 1;
        if (mode.auto) {
          setImmediate(() => port1.onmessage());
        } else {
          posted.push(() => port1.onmessage());
        }
      },
    };
  });

  return {
    posted,
    counts,
    deliver: () => posted.shift()(),
    setAuto: (auto) => {
      mode.auto = !!auto;
    },
  };
}

// The tasks soon() has queued and not run: a timer turn's, recorded by
// fake-lodash-timers.js, or a message's. Which one soon() picks depends on
// the time since its last timer turn. A series queues one task at a time.
function soonTasks(timers, channel) {
  return {
    pending: () => timers.delayed.length + channel.posted.length,
    runNext: () =>
      timers.delayed.length ? timers.delayed.shift().fn() : channel.deliver(),
  };
}

module.exports = { installFakeMessageChannel, soonTasks };
