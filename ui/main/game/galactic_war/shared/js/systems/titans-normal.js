// GWO - change the Players arrays and add classic systems.
// template-loader.js picks the first group whose range contains the army count, so
// these must not overlap: an overlapping lower bound is a dead range that looks
// meaningful, and re-ordering the groups would silently change which systems a given
// army count draws from.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/planets.js",
], function (gwoPlanets) {
  return [
    {
      Players: [0, 3],
      Systems: [
        {
          Planets: [gwoPlanets.planet1],
        },
        {
          Planets: [gwoPlanets.planet2],
        },
        {
          Planets: [gwoPlanets.planet3],
        },
        {
          Planets: [gwoPlanets.planet4],
        },
        {
          Planets: [gwoPlanets.planet5],
        },
        {
          Planets: [gwoPlanets.planet6],
        },
        {
          Planets: [gwoPlanets.planet7],
        },
        {
          Planets: [gwoPlanets.planet8],
        },
      ],
    },
    {
      Players: [4, 6],
      Systems: [
        {
          Planets: [gwoPlanets.planet1],
        },
        {
          Planets: [gwoPlanets.planet9],
        },
        {
          Planets: [gwoPlanets.planet1, gwoPlanets.planet10],
        },
        {
          Planets: [gwoPlanets.planet11, gwoPlanets.planet12],
        },
        {
          Planets: [gwoPlanets.planet1, gwoPlanets.planet13],
        },
        {
          Planets: [gwoPlanets.planet14, gwoPlanets.planet13],
        },
        {
          Planets: [
            gwoPlanets.planet15,
            gwoPlanets.planet16,
            gwoPlanets.planet17,
          ],
        },
        {
          Planets: [gwoPlanets.planet18],
        },
        {
          Planets: [gwoPlanets.planet7],
        },
        {
          Planets: [gwoPlanets.planet18, gwoPlanets.planet12],
        },
      ],
    },
    {
      Players: [7, 10],
      Systems: [
        {
          Planets: [gwoPlanets.planet19],
        },
        {
          Planets: [gwoPlanets.planet20, gwoPlanets.planet12],
        },
        {
          Planets: [
            gwoPlanets.planet21,
            gwoPlanets.planet12,
            gwoPlanets.planet22,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet23,
            gwoPlanets.planet24,
            gwoPlanets.planet25,
            gwoPlanets.planet26,
            gwoPlanets.planet27,
            gwoPlanets.planet28,
            gwoPlanets.planet29,
            gwoPlanets.planet30,
            gwoPlanets.planet31,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet32,
            gwoPlanets.planet33,
            gwoPlanets.planet34,
            gwoPlanets.planet35,
            gwoPlanets.planet36,
            gwoPlanets.planet37,
            gwoPlanets.planet38,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet15,
            gwoPlanets.planet39,
            gwoPlanets.planet17,
            gwoPlanets.planet40,
            gwoPlanets.planet41,
          ],
        },
      ],
    },
    {
      Players: [11, 100],
      Systems: [
        {
          Planets: [gwoPlanets.planet42],
        },
        {
          Planets: [gwoPlanets.planet43, gwoPlanets.planet12],
        },
        {
          Planets: [
            gwoPlanets.planet20,
            gwoPlanets.planet12,
            gwoPlanets.planet22,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet44,
            gwoPlanets.planet45,
            gwoPlanets.planet46,
            gwoPlanets.planet47,
            gwoPlanets.planet48,
            gwoPlanets.planet49,
            gwoPlanets.planet50,
            gwoPlanets.planet51,
            gwoPlanets.planet52,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet44,
            gwoPlanets.planet53,
            gwoPlanets.planet45,
            gwoPlanets.planet49,
          ],
        },
        {
          Planets: [
            gwoPlanets.planet54,
            gwoPlanets.planet33,
            gwoPlanets.planet34,
            gwoPlanets.planet35,
            gwoPlanets.planet36,
            gwoPlanets.planet37,
            gwoPlanets.planet38,
          ],
        },
      ],
    },
  ];
});
