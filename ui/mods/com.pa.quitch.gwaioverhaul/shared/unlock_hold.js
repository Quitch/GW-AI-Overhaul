// The count behind bank.js's unlock hold, kept apart so shared/cards.js can
// read it without loading a bank. See coop.md, "Whose unlocks are whose".
define(function () {
  var holds = 0;

  return {
    // Whether this is the first hold.
    hold: function () {
      holds++;
      return holds === 1;
    },

    // Whether this released the last hold. A release with no hold does nothing.
    release: function () {
      if (!holds) {
        return false;
      }
      holds--;
      return holds === 0;
    },

    held: function () {
      return holds > 0;
    },
  };
});
