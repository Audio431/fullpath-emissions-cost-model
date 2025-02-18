import { MessageType } from '../common/message.types';

export class EventHandler {
  private clickHandler: ((e: Event) => void) | null = null;
  private scrollHandler: ((e: Event) => void) | null = null;
  private port: browser.runtime.Port | null = null;
  private readonly eventHandlers = new Map<MessageType, (payload: any) => void>();

  constructor() {
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    this.eventHandlers.set(MessageType.CLICK_EVENT, (target: HTMLElement) => {
      this.port?.postMessage({
        type: MessageType.CLICK_EVENT,
        from: 'content',
        payload: target.tagName
      });
    });

    this.eventHandlers.set(MessageType.SCROLL_EVENT, (scrollY: number) => {
      this.port?.postMessage({
        type: MessageType.SCROLL_EVENT,
        from: 'content',
        payload: scrollY
      });
    });
  }

  setPort(port: browser.runtime.Port): void {
    this.port = port;
    this.port.onDisconnect.addListener(() => {
      this.port = null;
    });
  }

  clearPort(): void {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

  startTracking(): void {
    if (!this.port) {
      console.error('No port connection available');
      return;
    }

    this.clickHandler = (e: Event) => {
      const handler = this.eventHandlers.get(MessageType.CLICK_EVENT);
      if (handler) {
        handler(e.target as HTMLElement);
      }
    };

    this.scrollHandler = () => {
      const handler = this.eventHandlers.get(MessageType.SCROLL_EVENT);
      if (handler) {
        handler(window.scrollY);
      }
    };

    window.addEventListener('click', this.clickHandler, true);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  stopTracking(): void {
    if (this.clickHandler) {
      window.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = null;
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    this.clearPort();
  }
}