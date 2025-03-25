import { EventHandler } from './event-handler';

const eventHandler = new EventHandler();

let trackingPort: browser.runtime.Port;


browser.runtime.onMessage.addListener((msg : RuntimeMessage, sender, sendResponse) => {
    switch (msg.type) {
        case 'TRACKING_STATE':
            if (msg.payload.state) {
                // Start tracking
                trackingPort = browser.runtime.connect({ name: 'content-script'});
                eventHandler.setPort(trackingPort);
                eventHandler.startTracking();
            } else {
                // Stop tracking
                eventHandler.stopTracking();
                trackingPort && trackingPort.disconnect();
            }
            break;
    }
});
