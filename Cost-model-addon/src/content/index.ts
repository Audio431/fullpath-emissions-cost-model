import { ContentTrackingHandler } from './tracking-handler';

const contentTrackingHandler = new ContentTrackingHandler();

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "TRACKING_STATE") {
    if (message.payload) {
      contentTrackingHandler.enableTracking();
    } else {
      contentTrackingHandler.disableTracking();
    }
  }
});