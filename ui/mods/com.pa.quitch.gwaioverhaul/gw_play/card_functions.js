define({
  hasUnit: function (path) {
    return _.some(model.game().inventory().units(), function (unit) {
      return path === unit;
    });
  },
});
