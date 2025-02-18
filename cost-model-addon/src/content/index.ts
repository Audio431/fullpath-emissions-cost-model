import { EventHandler } from './event-handler';
import { MessageType, Message } from '../common/message.types';
import { inputBaseClasses } from '@mui/material';

const eventHandler = new EventHandler();

function initializePort(): browser.runtime.Port {
  const port = browser.runtime.connect({ name: 'content-script' });
  
  // Register content script
  port.postMessage({
    type: MessageType.REGISTER,
    from: 'content',
    payload: 'Content script ready'
  });

  // Handle messages from background
  port.onMessage.addListener((message: any) => {
    if (message.type === MessageType.TRACKING_STATE && message.from === 'background') {
      if (message.payload) {
        eventHandler.setPort(port);
        eventHandler.startTracking();
      } else {
        eventHandler.stopTracking();
      }
    }
  });

  return port;
}

initializePort();