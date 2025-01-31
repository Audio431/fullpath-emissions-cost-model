let trackingActive = false;
let clickHandler: (e: Event) => void;
let scrollHandler: (e: Event) => void;

function startTracking() {
  if (trackingActive) return; // already tracking
  trackingActive = true;

  clickHandler = (e) => {
    console.log("[Content Script] Click event:", e);
    browser.runtime.sendMessage({ type: "CLICK_EVENT", payload: e });
  };
  scrollHandler = (e) => {
    console.log("[Content Script] Scroll event:", window.scrollY);
    browser.runtime.sendMessage({ type: "SCROLL_EVENT", payload: window.scrollY });
  };

  window.addEventListener("click", clickHandler, true);
  window.addEventListener("scroll", scrollHandler, { passive: true });
  console.log("[Content Script] Tracking STARTED");
}

function stopTracking() {
  if (!trackingActive) return; // already stopped
  trackingActive = false;

  window.removeEventListener("click", clickHandler, true);
  window.removeEventListener("scroll", scrollHandler);
  console.log("[Content Script] Tracking STOPPED");
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "TRACKING_STATE") {
    if (message.payload) {
      startTracking();
      browser.runtime.sendMessage({ type: "TRACKING_STARTED" });
    } else {
      stopTracking();
      browser.runtime.sendMessage({ type: "TRACKING_STOPPED" });
    }
  }
});


