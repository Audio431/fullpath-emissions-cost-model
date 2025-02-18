export enum MessageType {
  TRACKING_STATE = 'TRACKING_STATE',
  TOGGLE_TRACKING = 'TOGGLE_TRACKING',
  CLICK_EVENT = 'CLICK_EVENT',
  SCROLL_EVENT = 'SCROLL_EVENT',
  REGISTER = 'REGISTER'
}

export type MessageSource = 'background' | 'content' | 'sidebar';

export interface Message {
  type: MessageType;
  from: MessageSource;
  payload: any;
}
