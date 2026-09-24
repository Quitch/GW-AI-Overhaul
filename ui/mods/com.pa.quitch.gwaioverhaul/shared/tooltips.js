// Tooltips on GWO's own markup (.gwo-tip): Escape dismisses them, and the
// pointer can move onto one to read it. See accessibility.md.
(function () {
  try {
    var KEY_ESCAPE = 27;
    var $body = $("body");

    var tooltipFor = function (tip) {
      return $(tip).prev(".gwo-tip").data("bs.tooltip");
    };

    // A hidden tooltip can stay attached with only .in removed, so .in is what
    // marks one as showing.
    var isShowing = function (tooltip) {
      return !!(tooltip && tooltip.$tip && tooltip.$tip.hasClass("in"));
    };

    // .data rather than .tooltip("hide") on every .gwo-tip: calling the plugin
    // on a trigger that has no tooltip yet would create one.
    var openTooltips = function () {
      return $(".gwo-tip").filter(function () {
        return isShowing($(this).data("bs.tooltip"));
      });
    };

    $body.on("keydown", function (event) {
      if (event.which !== KEY_ESCAPE) {
        return;
      }
      var $open = openTooltips();
      if ($open.length) {
        $open.tooltip("hide");
        event.preventDefault();
        event.stopPropagation();
      }
    });

    // Bootstrap hides a tooltip as the pointer leaves its trigger, so the
    // pointer could never reach the tooltip itself.
    $body.on("mouseenter", ".tooltip", function () {
      var tooltip = tooltipFor(this);
      if (isShowing(tooltip)) {
        clearTimeout(tooltip.timeout);
        tooltip.hoverState = "in";
      }
    });
    $body.on("mouseleave", ".tooltip", function () {
      var tooltip = tooltipFor(this);
      if (isShowing(tooltip)) {
        tooltip.leave(tooltip);
      }
    });
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
