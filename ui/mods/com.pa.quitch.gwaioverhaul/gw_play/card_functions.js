define({
  hasUnit: function (id) {
    return _.some(model.game().inventory().units(), function (unit) {
      return id === unit;
    });
  },
});
