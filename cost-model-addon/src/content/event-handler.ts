import { Action, MessageType } from '../common/message.types';

export class EventHandler {
    private clickHandler: ((e: Event) => void) | null = null;
    private scrollHandler: ((e: Event) => void) | null = null;
    private port: browser.runtime.Port | null = null;
    private readonly eventHandlers = new Map<Action, (payload: any) => void>();
    constructor() {
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {

        this.eventHandlers.set(Action.CLICK_EVENT, (payload) => {
            this.port?.postMessage(
                {
                    type: MessageType.EVENT_LISTENER,
                    from: 'content',
                    payload
                }
            );
        });

        this.eventHandlers.set(Action.SCROLL_EVENT, (payload) => {
            this.port?.postMessage(
                {
                    type: MessageType.EVENT_LISTENER,
                    from: 'content',
                    payload
                }
            );
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
                const handler = this.eventHandlers.get(Action.CLICK_EVENT);
                const target = e.target as HTMLElement;

                const serializedTarget: ClickEventPayload = {
                    event: Action.CLICK_EVENT, // ✅ Required event type
                    elementDetails: {  // ✅ Wrap details inside elementDetails
                      tagName: target.tagName,
                      id: target.id || undefined,
                      classList: Array.from(target.classList),
                      href: target instanceof HTMLAnchorElement ? target.href : undefined,
                      innerText: target.innerText,
                    }
                };
                handler?.(serializedTarget);
        };

        this.scrollHandler = () => {
            const handler = this.eventHandlers.get(Action.SCROLL_EVENT);
            const payload: ScrollEventPayload = {
                event: Action.SCROLL_EVENT,
                scrollY: window.scrollY
            };

            handler?.(payload);
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