// Stock GW.manifest.saveGame resolves before IndexedDB commits, and a page
// change can lose the uncommitted star systems. See galaxy.md, "Saving the
// new war", and architecture.md, "Saving the war".
define(function () {
  var DATABASE = "gw_manifest";
  var STORES = ["systems", "games", "manifest"];

  var incomplete = function (id, missing) {
    var error = new Error(
      "War " + id + " was not stored: no " + missing.join(" or ") + " record"
    );
    error.gwoIncomplete = true;
    return error;
  };

  var readBack = function (db, id, done, check) {
    // Read/write, not read-only: Chromium 40 runs a read-only transaction
    // beside an unfinished write to the same store.
    var transaction = db.transaction(STORES, "readwrite");
    var game = transaction.objectStore("games").get(id);
    var systems = transaction.objectStore("systems").get(id);

    transaction.oncomplete = function () {
      db.close();
      var missing = [];
      if (!game.result) {
        missing.push("games");
      }
      if (!systems.result) {
        missing.push("systems");
      }
      if (check && missing.length) {
        done.reject(incomplete(id, missing));
      } else {
        done.resolve();
      }
    };
    transaction.onabort = function () {
      db.close();
      done.reject(transaction.error);
    };
  };

  var afterWrites = function (id, check) {
    var done = $.Deferred();
    // Deferred behind the manifest save that stock's addGame defers, so the
    // read waits for that write too.
    _.defer(function () {
      try {
        var request = indexedDB.open(DATABASE);
        request.onerror = function () {
          done.reject(request.error);
        };
        request.onsuccess = function () {
          var db = request.result;
          try {
            readBack(db, id, done, check);
          } catch (e) {
            db.close();
            done.reject(e);
          }
        };
      } catch (e) {
        done.reject(e);
      }
    });
    return done.promise();
  };

  return {
    // Once the war's earlier writes have committed; rejects, marked
    // gwoIncomplete, if its game or systems record is missing.
    committed: function (id) {
      return afterWrites(id, true);
    },
    // Once the war's earlier writes have committed, whatever was stored.
    settled: function (id) {
      return afterWrites(id, false);
    },
  };
});
