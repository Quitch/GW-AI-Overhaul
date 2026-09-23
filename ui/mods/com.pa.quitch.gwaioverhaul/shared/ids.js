// Registry ids - races, decks, mod identifiers - compare trimmed and
// case-blind.
define(function () {
  return {
    normalize: function (id) {
      return _.isString(id) ? id.trim().toLowerCase() : "";
    },
  };
});
