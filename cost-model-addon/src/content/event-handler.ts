import { Action, MessageType } from '../common/message.types';

export class EventHandler {
    private clickHandler: ((e: Event) => void) | null = null;
    private scrollHandler: ((e: Event) => void) | null = null;
    private port: browser.runtime.Port | null = null;
    private readonly eventHandlers = new Map<Action, (payload: any) => void>();

    // Metrics properties
    private aggregatedLongTaskTime: number = 0;
    private longTaskCount: number = 0;
    private mutationCount: number = 0;

    private performanceObserver: PerformanceObserver | null = null;
    private mutationObserver: MutationObserver | null = null;

    // IDs for intervals so we can clear them later
    private longTaskIntervalId: number | null = null;
    private mutationIntervalId: number | null = null;

    // Optional: a flag to prevent double start
    private trackingActive = false;

    constructor() {
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        // Setup your event map so you can post messages to your background script
        this.eventHandlers.set(Action.CLICK_EVENT, (payload) => {
            this.port?.postMessage({
                type: MessageType.EVENT_LISTENER,
                from: 'content',
                payload,
            });
        });

        this.eventHandlers.set(Action.SCROLL_EVENT, (payload) => {
            this.port?.postMessage({
                type: MessageType.EVENT_LISTENER,
                from: 'content',
                payload,
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

    /**
     * Sets up the PerformanceObserver to track long tasks.
     * Aggregates long task durations and logs every 1 second.
     */
    private setupLongTaskObserver(): void {
        this.performanceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                console.log(`[Debug] Long Task detected: ${entry.duration} ms`);
                this.aggregatedLongTaskTime += entry.duration;
                this.longTaskCount++;
            });
        });

        // Use the correct entry types for detecting long tasks
        // If you also want navigation info, add 'navigation' as well:
        this.performanceObserver.observe({ entryTypes: ['longtask'] });

        // Every second, log and reset
        this.longTaskIntervalId = window.setInterval(() => {
            (window as any).currentLongTaskTime = this.aggregatedLongTaskTime;
            console.log(
                `[Debug] Aggregated Long Task Time in the last second: ${this.aggregatedLongTaskTime.toFixed(
                    2
                )} ms, Task count: ${this.longTaskCount}`
            );
            // Reset
            this.aggregatedLongTaskTime = 0;
            this.longTaskCount = 0;
        }, 1000);
    }

    /**
     * Sets up a MutationObserver to track DOM changes.
     * Aggregates the number of mutation records and logs every 1 second.
     */
    private setupMutationObserver(): void {
        this.mutationObserver = new MutationObserver((mutations) => {
            // Count each mutation record
            this.mutationCount += mutations.length;
        });
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        // Every second, log and reset
        this.mutationIntervalId = window.setInterval(() => {
            (window as any).currentMutationCount = this.mutationCount;
            console.log(`[Debug] Mutation count in the last second: ${this.mutationCount}`);
            // Reset
            this.mutationCount = 0;
        }, 1000);
    }

    /**
     * Start tracking: set up observers once and attach event handlers.
     */
    startTracking(): void {
        if (this.trackingActive) {
            console.warn('[Debug] startTracking() called but tracking is already active.');
            return;
        }
        this.trackingActive = true;

        if (!this.port) {
            console.error('No port connection available');
            return;
        }

        // Set up both observers
        this.setupLongTaskObserver();
        this.setupMutationObserver();

        // Click Handler
        this.clickHandler = (e: Event) => {
            const target = e.target as HTMLElement;
            console.log('Received click event:', target);

            // --- Navigation Metric ---
            let isNavigation = false;
            let navigationHref: string | undefined;
            const linkElement = target.closest('a');
            if (linkElement) {
                isNavigation = true;
                navigationHref = linkElement.href;
                e.preventDefault();
                // Trigger navigation
                window.location.href = navigationHref;
                console.log('Navigation triggered, href:', navigationHref);
            }

            // --- Retrieve Long Task & DOM Mutation Metrics (aggregated in the last second) ---
            const jsLongTaskTime: number = (window as any).currentLongTaskTime || 0;
            const currentMutationCount: number = (window as any).currentMutationCount || 0;

            console.log(
                `[Debug] Click event metrics - jsLongTaskTime: ${jsLongTaskTime} ms, mutationCount: ${currentMutationCount}`
            );

            // Optionally post these metrics back via the mapped event handler
            // const payload: ClickEventPayload = { ... }
            // const handler = this.eventHandlers.get(Action.CLICK_EVENT);
            // handler?.(payload);
        };

        // Scroll Handler
        this.scrollHandler = () => {
            const handler = this.eventHandlers.get(Action.SCROLL_EVENT);
            const payload: ScrollEventPayload = {
                event: Action.SCROLL_EVENT,
                scrollY: window.scrollY,
            };

            handler?.(payload);
        };

        // Attach listeners with consistent options
        window.addEventListener('click', this.clickHandler, true);
        window.addEventListener('scroll', this.scrollHandler, {
            passive: true,
            capture: false,
        } as AddEventListenerOptions);
    }

    /**
     * Stop tracking: remove event listeners, clear intervals, and disconnect observers.
     */
    stopTracking(): void {
        if (!this.trackingActive) {
            console.warn('[Debug] stopTracking() called but tracking was not active.');
            return;
        }
        this.trackingActive = false;

        // Remove event listeners
        if (this.clickHandler) {
            window.removeEventListener('click', this.clickHandler, true);
            this.clickHandler = null;
        }
        if (this.scrollHandler) {
            // Pass the same options object used in addEventListener
            window.removeEventListener('scroll', this.scrollHandler, {
                passive: true,
                capture: false,
            } as AddEventListenerOptions);
            this.scrollHandler = null;
        }

        // Clear port
        this.clearPort();

        // Clear intervals
        if (this.longTaskIntervalId !== null) {
            clearInterval(this.longTaskIntervalId);
            this.longTaskIntervalId = null;
        }
        if (this.mutationIntervalId !== null) {
            clearInterval(this.mutationIntervalId);
            this.mutationIntervalId = null;
        }

        // Disconnect observers
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
    }
}
