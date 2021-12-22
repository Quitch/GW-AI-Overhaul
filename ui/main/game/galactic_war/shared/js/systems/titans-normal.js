// We changed the Players arrays
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/js/systems/planets.js",
], function (gwaioPlanets) {
  return [
    {
      Players: [0, 3],
      Systems: [
        {
          Planets: [gwaioPlanets.planet1],
        },
        {
          Planets: [gwaioPlanets.planet2],
        },
        {
          Planets: [gwaioPlanets.planet3],
        },
        {
          Planets: [gwaioPlanets.planet4],
        },
        {
          Planets: [gwaioPlanets.planet5],
        },
        {
          Planets: [gwaioPlanets.planet6],
        },
        {
          Planets: [gwaioPlanets.planet7],
        },
        {
          Planets: [gwaioPlanets.planet8],
        },
      ],
    },
    {
      Players: [2, 6],
      Systems: [
        {
          Planets: [gwaioPlanets.planet1],
        },
        {
          Planets: [gwaioPlanets.planet9],
        },
        {
          Planets: [gwaioPlanets.planet1, gwaioPlanets.planet10],
        },
        {
          Planets: [gwaioPlanets.planet11, gwaioPlanets.planet12],
        },
        {
          Planets: [gwaioPlanets.planet1, gwaioPlanets.planet13],
        },
        {
          Planets: [gwaioPlanets.planet14, gwaioPlanets.planet13],
        },
        {
          Planets: [
            gwaioPlanets.planet15,
            gwaioPlanets.planet16,
            gwaioPlanets.planet17,
          ],
        },
        {
          Planets: [gwaioPlanets.planet18],
        },
        {
          Planets: [gwaioPlanets.planet7],
        },
        {
          Planets: [gwaioPlanets.planet18, gwaioPlanets.planet12],
        },
      ],
    },
    {
      Players: [4, 10],
      Systems: [
        {
          Planets: [gwaioPlanets.planet19],
        },
        {
          Planets: [gwaioPlanets.planet20, gwaioPlanets.planet12],
        },
        {
          Planets: [
            gwaioPlanets.planet21,
            gwaioPlanets.planet12,
            gwaioPlanets.planet22,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet23,
            gwaioPlanets.planet24,
            gwaioPlanets.planet25,
            gwaioPlanets.planet26,
            gwaioPlanets.planet27,
            gwaioPlanets.planet28,
            gwaioPlanets.planet29,
            gwaioPlanets.planet30,
            gwaioPlanets.planet31,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet32,
            gwaioPlanets.planet33,
            gwaioPlanets.planet34,
            gwaioPlanets.planet35,
            gwaioPlanets.planet36,
            gwaioPlanets.planet37,
            gwaioPlanets.planet38,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet15,
            gwaioPlanets.planet39,
            gwaioPlanets.planet17,
            gwaioPlanets.planet40,
            gwaioPlanets.planet41,
          ],
        },
      ],
    },
    {
      Players: [6, 100],
      Systems: [
        {
          Planets: [gwaioPlanets.planet42],
        },
        {
          Planets: [gwaioPlanets.planet43, gwaioPlanets.planet12],
        },
        {
          Planets: [
            gwaioPlanets.planet20,
            gwaioPlanets.planet12,
            gwaioPlanets.planet22,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet44,
            gwaioPlanets.planet45,
            gwaioPlanets.planet46,
            gwaioPlanets.planet47,
            gwaioPlanets.planet48,
            gwaioPlanets.planet49,
            gwaioPlanets.planet50,
            gwaioPlanets.planet51,
            gwaioPlanets.planet52,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet44,
            gwaioPlanets.planet53,
            gwaioPlanets.planet45,
            gwaioPlanets.planet49,
          ],
        },
        {
          Planets: [
            gwaioPlanets.planet54,
            gwaioPlanets.planet33,
            gwaioPlanets.planet34,
            gwaioPlanets.planet35,
            gwaioPlanets.planet36,
            gwaioPlanets.planet37,
            gwaioPlanets.planet38,
          ],
        },
      ],
    },
  ];
});
