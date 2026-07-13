define({
  setupGwoCards: function (gwoSettings) {
    var loadouts = [
      "gwaio_start_backpacker",
      "gwaio_start_ceo",
      "gwaio_start_hoarder",
      "gwaio_start_lucky",
      "gwaio_start_naval",
      "gwaio_start_nomad",
      "gwaio_start_paratrooper",
      "gwaio_start_rapid",
      "gwaio_start_terminal",
      "gwaio_start_tourist",
      "gwaio_start_warp",
      "gwc_start_air",
      "gwc_start_allfactory",
      "gwc_start_artillery",
      "gwc_start_bot",
      "gwc_start_combatcdr",
      "gwc_start_orbital",
      "gwc_start_storage",
      "gwc_start_subcdr",
      "gwc_start_vehicle",
      "nem_start_deepspace",
      "nem_start_nuke",
      "nem_start_planetary",
      "nem_start_tower_rush",
      "tgw_start_speed",
      "tgw_start_tank",
    ];
    var basicCards = [
      "gwc_add_card_slot",
      "gwc_bld_efficiency_cdr",
      "gwc_bld_efficiency_fabs",
      "gwc_combat_air",
      "gwc_combat_bots",
      "gwc_combat_commander",
      "gwc_combat_orbital",
      "gwc_combat_sea",
      "gwc_combat_structures",
      "gwc_combat_vehicles",
      "gwc_cost_air",
      "gwc_cost_artillery",
      "gwc_cost_bots",
      "gwc_cost_defenses",
      "gwc_cost_economy",
      "gwc_cost_orbital",
      "gwc_cost_sea",
      "gwc_cost_super_weapons",
      "gwc_cost_titans",
      "gwc_cost_vehicles",
      "gwc_damage_air",
      "gwc_damage_artillery",
      "gwc_damage_bots",
      "gwc_damage_commander",
      "gwc_damage_defenses",
      "gwc_damage_orbital",
      "gwc_damage_sea",
      "gwc_damage_vehicles",
      "gwc_enable_air_all",
      "gwc_enable_air_t1",
      "gwc_enable_artillery",
      "gwc_enable_bots_all",
      "gwc_enable_bots_t1",
      "gwc_enable_defenses_t2",
      "gwc_enable_orbital_all",
      "gwc_enable_sea_all",
      "gwc_enable_titans",
      "gwc_enable_vehicles_all",
      "gwc_enable_vehicles_t1",
      "gwc_energy_efficiency_all",
      "gwc_health_air",
      "gwc_health_bots",
      "gwc_health_commander",
      "gwc_health_orbital",
      "gwc_health_sea",
      "gwc_health_structures",
      "gwc_health_vehicles",
      "gwc_minion",
      "gwc_speed_air",
      "gwc_speed_bots",
      "gwc_speed_commander",
      "gwc_speed_orbital",
      "gwc_speed_sea",
      "gwc_speed_vehicles",
      "gwc_storage_1",
      "gwc_storage_and_buff",
    ];
    var expandedCards = [
      "gwaio_anti_air",
      "gwaio_anti_bots",
      "gwaio_anti_commander",
      "gwaio_anti_hover",
      "gwaio_anti_orbital",
      "gwaio_anti_sea",
      "gwaio_anti_structure",
      "gwaio_anti_vehicles",
      "gwaio_combat_titans",
      "gwaio_cooldown_air",
      "gwaio_cooldown_bots",
      "gwaio_cooldown_orbital",
      "gwaio_cooldown_sea",
      "gwaio_cooldown_vehicles",
      "gwaio_damage_titans",
      "gwaio_enable_bounties",
      "gwaio_enable_eradication",
      "gwaio_enable_factories_t1_all",
      "gwaio_enable_landanywhere",
      "gwaio_enable_orbitalbombardment",
      "gwaio_enable_planetaryradar",
      "gwaio_enable_suddendeath",
      "gwaio_enable_tsunami",
      "gwaio_health_titans",
      "gwaio_protocol_agility",
      "gwaio_protocol_blindness",
      "gwaio_protocol_disposability",
      "gwaio_protocol_fortitude",
      "gwaio_protocol_killswitch",
      "gwaio_protocol_precision",
      "gwaio_protocol_wrath",
      "gwaio_speed_structure",
      "gwaio_speed_titans",
      "gwaio_upgrade_advancedairfactory",
      "gwaio_upgrade_advancedbotfactory",
      "gwaio_upgrade_advancedenergyplant",
      "gwaio_upgrade_advancedfabricationaircraft",
      "gwaio_upgrade_advancedfabricationbot",
      "gwaio_upgrade_advancedfabricationship",
      "gwaio_upgrade_advancedfabricationvehicle",
      "gwaio_upgrade_advancedlaserdefensetower",
      "gwaio_upgrade_advancedmetalextractor",
      "gwaio_upgrade_advancednavalfactory",
      "gwaio_upgrade_advancedradar",
      "gwaio_upgrade_advancedradarsatellite",
      "gwaio_upgrade_advancedtorpedolauncher",
      "gwaio_upgrade_advancedvehiclefactory",
      "gwaio_upgrade_airfactory",
      "gwaio_upgrade_anchor",
      "gwaio_upgrade_angel",
      "gwaio_upgrade_ant",
      "gwaio_upgrade_antinuke",
      "gwaio_upgrade_ares",
      "gwaio_upgrade_arkyd",
      "gwaio_upgrade_artemis",
      "gwaio_upgrade_astraeus",
      "gwaio_upgrade_atlas",
      "gwaio_upgrade_avenger",
      "gwaio_upgrade_barnacle",
      "gwaio_upgrade_barracuda",
      "gwaio_upgrade_bluehawk",
      "gwaio_upgrade_boom",
      "gwaio_upgrade_botfactory",
      "gwaio_upgrade_bumblebee",
      "gwaio_upgrade_catalyst",
      "gwaio_upgrade_catapult",
      "gwaio_upgrade_colonel",
      "gwaio_upgrade_dox",
      "gwaio_upgrade_drifter",
      "gwaio_upgrade_energyplant",
      "gwaio_upgrade_energystorage",
      "gwaio_upgrade_fabricationaircraft",
      "gwaio_upgrade_fabricationbot",
      "gwaio_upgrade_fabricationship",
      "gwaio_upgrade_fabricationvehicle",
      "gwaio_upgrade_firefly",
      "gwaio_upgrade_flak",
      "gwaio_upgrade_galata",
      "gwaio_upgrade_gile",
      "gwaio_upgrade_grenadier",
      "gwaio_upgrade_halley",
      "gwaio_upgrade_helios",
      "gwaio_upgrade_hermes",
      "gwaio_upgrade_holkins",
      "gwaio_upgrade_hornet",
      "gwaio_upgrade_horsefly",
      "gwaio_upgrade_hummingbird",
      "gwaio_upgrade_icarus",
      "gwaio_upgrade_inferno",
      "gwaio_upgrade_jig",
      "gwaio_upgrade_kaiju",
      "gwaio_upgrade_kessler",
      "gwaio_upgrade_kestrel",
      "gwaio_upgrade_kraken",
      "gwaio_upgrade_laserdefensetower",
      "gwaio_upgrade_leveler",
      "gwaio_upgrade_leviathan",
      "gwaio_upgrade_lob",
      "gwaio_upgrade_locusts",
      "gwaio_upgrade_manhattan",
      "gwaio_upgrade_mend",
      "gwaio_upgrade_metalextractor",
      "gwaio_upgrade_metalstorage",
      "gwaio_upgrade_mine",
      "gwaio_upgrade_narwhal",
      "gwaio_upgrade_navalfactory",
      "gwaio_upgrade_nukes",
      "gwaio_upgrade_nyx",
      "gwaio_upgrade_omega",
      "gwaio_upgrade_orbitalfabricationbot",
      "gwaio_upgrade_orbitalfactory",
      "gwaio_upgrade_orbitallauncher",
      "gwaio_upgrade_orca",
      "gwaio_upgrade_pelican",
      "gwaio_upgrade_pelter",
      "gwaio_upgrade_phoenix",
      "gwaio_upgrade_piranha",
      "gwaio_upgrade_planetaryradar",
      "gwaio_upgrade_radar",
      "gwaio_upgrade_radarjammer",
      "gwaio_upgrade_ragnarok",
      "gwaio_upgrade_sheller",
      "gwaio_upgrade_singlelaserdefensetower",
      "gwaio_upgrade_skitter",
      "gwaio_upgrade_slammer",
      "gwaio_upgrade_solararray",
      "gwaio_upgrade_spark",
      "gwaio_upgrade_spinner",
      "gwaio_upgrade_squall",
      "gwaio_upgrade_stinger",
      "gwaio_upgrade_stingray",
      "gwaio_upgrade_stitch",
      "gwaio_upgrade_storm",
      "gwaio_upgrade_stryker",
      "gwaio_upgrade_subcommander_duplication",
      "gwaio_upgrade_subcommander_fabber",
      "gwaio_upgrade_subcommander_tactics",
      "gwaio_upgrade_sxx",
      "gwaio_upgrade_teleporter",
      "gwaio_upgrade_torpedolauncher",
      "gwaio_upgrade_typhoon",
      "gwaio_upgrade_ubercannon_structure",
      "gwaio_upgrade_umbrella",
      "gwaio_upgrade_unitcannon",
      "gwaio_upgrade_vanguard",
      "gwaio_upgrade_vehiclefactory",
      "gwaio_upgrade_wall",
      "gwaio_upgrade_ward",
      "gwaio_upgrade_wyrm",
      "gwaio_upgrade_zeus",
      // not enabled in vanilla GW
      "gwc_cost_intel",
      "gwc_energy_efficiency_intel",
      "gwc_energy_efficiency_weapons",
    ];
    // global for modder compatibility
    model.gwoCards = _.isArray(model.gwoCards) ? model.gwoCards : [];

    if (
      !gwoSettings || // non-GWO saves
      !gwoSettings.techCardDeck || // v5.35.0 and earlier
      gwoSettings.techCardDeck === "Expanded"
    ) {
      return model.gwoCards.concat(loadouts, basicCards, expandedCards);
    }
    return model.gwoCards.concat(loadouts, basicCards);
  },

  setupGwoDeck: function (cards, deck, cardsRemaining, promise) {
    _.forEach(model.gwoCards, function (cardId) {
      requireGW(["cards/" + cardId], function (card) {
        card.id = cardId;
        cards.push(card);
        deck.push(cardId);
        --cardsRemaining;
        if (cardsRemaining === 0) {
          promise.resolve();
        }
      });
    });
  },

  dealCard: function (params, loaded) {
    console.debug("Dealing GWO card:", params.id, "with params:", params);
    var result = $.Deferred();
    loaded.then(function () {
      var card = _.find(model.gwoCards, function (cardId) {
        return cardId === params.id;
      });

      if (!card) {
        result.reject(new Error("GWO card not found: " + params.id));
        return result;
      }

      // Simulate a deal
      var context =
        card.getContext && card.getContext(params.galaxy, params.inventory);

      var deal = card.deal && card.deal(params.star, context);
      var product = { id: params.id };
      var cardParams = deal && deal.params;
      if (cardParams && _.isObject(cardParams)) {
        _.assign(product, cardParams);
      }
      card.keep && card.keep(deal, context);
      card.releaseContext && card.releaseContext(context);

      result.resolve(product);
    });
    return result;
  },
});
