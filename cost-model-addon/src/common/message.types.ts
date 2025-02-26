enum MessageType {
  TRACKING_STATE = 'TRACKING_STATE',
  TOGGLE_TRACKING = 'TOGGLE_TRACKING',
  EVENT_LISTENER = 'EVENT_LISTENER',
  REGISTER = 'REGISTER',
}

enum Action {
  CLICK_EVENT = 'CLICK_EVENT',
  SCROLL_EVENT = 'SCROLL_EVENT',
}

declare global {

  interface ClickEventPayload {
    event: Action.CLICK_EVENT;
    elementDetails: {
      tagName: string;
      id?: string;
      classList?: string[];
      href?: string;
      innerText?: string;
    };
  }

  interface ScrollEventPayload {
    event: Action.SCROLL_EVENT;
    scrollY: number; // scrollY value
  }


  type MessageSources = 'background' | 'content' | 'sidebar' | 'devtools';

  interface MessagePayloads {
    [MessageType.TRACKING_STATE]: { state: boolean };
    [MessageType.TOGGLE_TRACKING]: { enabled: boolean };
    [MessageType.EVENT_LISTENER]: ClickEventPayload | ScrollEventPayload;
    [MessageType.REGISTER]: { id: string; info?: any };

  }

  interface Message<T extends MessageType = MessageType> {
    type: T;
    from?: MessageSources;
    payload: MessagePayloads[T];
  }

  type RuntimeMessage = {
    [K in MessageType]: {
      type: K;
      from?: MessageSources;
      payload: MessagePayloads[K];
    }
  }[MessageType];
}

export { Action, MessageType };