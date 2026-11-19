(function (wp) {
  "use strict";
  if (!wp || !wp.blocks || !wp.element || !wp.components) return;
  [
    ["page", "JSON-driven Page", "Renders the page-specific HTML layout from data/content.json."],
    ["header", "Meta Grey Label Header", "Shared header sourced from the JSON document."],
    ["footer", "Meta Grey Label Footer", "Shared footer sourced from the JSON document."]
  ].forEach(function (item) {
    wp.blocks.registerBlockType("mgl/" + item[0], {
      apiVersion: 3,
      title: item[1],
      category: "theme",
      icon: "layout",
      supports: { html: false, inserter: false },
      edit: function () {
        return wp.element.createElement(
          wp.components.Placeholder,
          { label: item[1] },
          wp.element.createElement("p", null, item[2])
        );
      },
      save: function () { return null; }
    });
  });
})(window.wp);
