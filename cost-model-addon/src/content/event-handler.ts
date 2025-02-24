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

        this.eventHandlers.set(MessageType.EVENT_LISTENER, (target: HTMLElement) => {
            this.port?.postMessage({
                type: MessageType.EVENT_LISTENER,
                from: 'content',
                payload: { event: 'click', details: target.outerHTML }
            });
        });

        this.eventHandlers.set(MessageType.EVENT_LISTENER, (scrollY: number) => {
            this.port?.postMessage({
                type: MessageType.EVENT_LISTENER,
                from: 'content',
                payload: { event: 'scroll', details: scrollY }
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
            const handler = this.eventHandlers.get(MessageType.EVENT_LISTENER);
 
            if (handler) {
                handler({ event: 'click', details: e.target as HTMLElement });
            }
        };

        this.scrollHandler = () => {
            const handler = this.eventHandlers.get(MessageType.EVENT_LISTENER);

            if (handler) {
                handler({ event: 'scroll', details: window.scrollY });
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