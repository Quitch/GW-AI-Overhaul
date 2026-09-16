// Refuses to fight a war whose map packs the player is no longer running. The
// observables and the gate itself are races.js's; this only fills them. See
// galaxy.md, "Biome mods in a GW battle".
(() => {
  try {
    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/biome_check.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
      ],
      (gwoBiomeMods, biomeCheck, gwoAI) => {
        const settings = gwoAI.originSettings(model.game());
        const recorded = settings && settings.biomeMods;
        const systems = _.map(model.game().galaxy().stars(), (star) =>
          star.system(),
        );
        const needed = biomeCheck.warBiomeMods(recorded, systems);

        if (!needed.length) {
          return;
        }

        const describe = (entry) => {
          // Not a map pack's own line: without GW Server Mods none can be
          // mounted.
          if (entry.reason === "gwServerMods") {
            return loc("!LOC:GW Server Mods is not enabled");
          }

          return `${entry.name} - ${entry.identifier} ${loc("!LOC:is not enabled")}`;
        };

        gwoBiomeMods.installedBiomeMods().then((info) => {
          const result = biomeCheck.evaluate(needed, info);

          const changed = _.map(
            result.warnings,
            (warning) => `${warning.name} ${warning.from} -> ${warning.to}`,
          );

          if (changed.length) {
            console.warn(`gwoBiomes: ${changed.join("; ")}`);
            model.gwoBiomeWarning(
              `${loc("!LOC:Map packs changed since this war began:")} ${changed.join("; ")}`,
            );
          }

          if (!result.blocked.length) {
            return;
          }

          const missing = _.map(result.blocked, describe);
          console.error(`gwoBiomes: ${missing.join("; ")}`);
          model.gwoBiomeBlock(missing);
          if (_.isFunction(model.gwoShowFightBlock)) {
            model.gwoShowFightBlock();
          }
        });
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
