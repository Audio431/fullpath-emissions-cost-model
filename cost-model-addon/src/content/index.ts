import { EventHandler } from './event-handler';
// import { MessageType, Message } from '../common/message.types';
// import { inputBaseClasses } from '@mui/material';

import { MessageType } from "../common/message.types";

const eventHandler = new EventHandler();

let trackingPort: browser.runtime.Port;

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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