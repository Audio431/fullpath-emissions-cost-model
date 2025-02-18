import { MessageType, Message } from '../../common/message.types';
import { BaseMessageHandler } from './base-handler';

export class ContentMessageHandler extends BaseMessageHandler {
  handleMessage(
    message: Message, 
    sender: any, 
    sendResponse: (response?: any) => void
  ): void {
    const handlers: Partial<Record<MessageType, (payload: any) => void>> = {
      [MessageType.CLICK_EVENT]: this.handleClickEvent.bind(this),
      [MessageType.SCROLL_EVENT]: this.handleScrollEvent.bind(this)
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message.payload);
    } else {
      this.handleUnknownMessage(message.type, sendResponse);
    }
  }

  private handleClickEvent(payload: any): void {
    console.log("Background: Received a click event:", payload);
  }

  private handleScrollEvent(payload: any): void {
    console.log("Background: Received a scroll event:", payload);
  }
}
