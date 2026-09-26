// Stand-ins for stock GW.specs.genUnitSpecs and modSpecs while the battle
// lobby builds its local overlay. The referee's copy of a player tag's specs
// wins over stock's rebuild, which lacks GWO's spec ops and race expansion.
// See specs.md, "The lobby overlay".
define(function () {
  var UNIT_LIST = "/pa/units/unit_list.json";
  var PLAYER_TAG = /^\.player\d*$/;

  var has = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  };

  // A player tag whose unit list the referee sent.
  var sentByReferee = function (files, tag) {
    return (
      _.isString(tag) &&
      PLAYER_TAG.test(tag) &&
      _.isObject(files) &&
      has(files, UNIT_LIST + tag)
    );
  };

  // `files` is the battle's file set, `stock` holds stock's two functions,
  // and `mod` is gw_play/specs.js's.
  var replacements = function (files, stock, mod) {
    return {
      // Fetches nothing for a tag the referee sent; stock builds the rest.
      genUnitSpecs: function (units, tag) {
        if (sentByReferee(files, tag)) {
          return $.Deferred().resolve({}).promise();
        }
        return stock.genUnitSpecs(units, tag);
      },

      // For a tag the referee sent, drops every file it sent, so its copy is
      // the one mounted: what is left is the tag's AI unit maps, which it
      // did not send. Any other tag takes GWO's ops.
      modSpecs: function (specs, mods, tag) {
        if (!sentByReferee(files, tag)) {
          return mod(specs, mods, tag);
        }
        _.forEach(_.keys(specs), function (key) {
          if (has(files, key)) {
            delete specs[key];
          }
        });
        return specs;
      },
    };
  };

  return {
    sentByReferee: sentByReferee,
    replacements: replacements,
  };
});
