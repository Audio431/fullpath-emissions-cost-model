function handleShown() {
  console.log("panel is being shown");
}

function handleHidden() {
  console.log("panel is being hidden");
}
browser.devtools.panels
  .create(
    "My Panel", // title
    "../../public/play.svg", // icon
    "panel.html", // content
  )
  .then((newPanel) => {
    newPanel.onShown.addListener(handleShown);
    newPanel.onHidden.addListener(handleHidden);
});