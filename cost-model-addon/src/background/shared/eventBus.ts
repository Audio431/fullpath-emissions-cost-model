// Generic signature for callbacks
type EventCallback<T = any> = (data: T) => void;

// Internal mapping of event names to arrays of callbacks
type EventMap = {
	[eventName: string]: EventCallback[];
};

class EventBus {
	private events: EventMap = {};

	// Subscribe to an event
	public on<T>(eventName: string, callback: EventCallback<T>): void {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}
		this.events[eventName].push(callback);
	}

	// Unsubscribe from an event
	public off<T>(eventName: string, callback: EventCallback<T>): void {
		if (!this.events[eventName]) {
			return;
		}
		this.events[eventName] = this.events[eventName].filter(
			(cb) => cb !== callback
		);
	}

	// Publish (emit) an event
	public publish<T>(eventName: string, data: T): void {
		const callbacks = this.events[eventName];
		if (!callbacks || callbacks.length === 0) {
			return;
		}
		callbacks.forEach((cb) => {
			cb(data);
		});
	}
}

// Export a single instance (singleton) for the entire extension
export const eventBus = new EventBus();