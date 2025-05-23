type EventCallback<T = any, R = any> = (data: T) => R | Promise<R>;


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

	// Subscribe to an event, but only once
	public once<T>(eventName: string, callback: EventCallback<T>): void {
		const wrapper: EventCallback<T> = (data: T) => {
			callback(data);
			this.off(eventName, wrapper);
		};
		this.on(eventName, wrapper);
	}

	// Publish (emit) an event
	public async publish<T, R = any>(eventName: string, data?: T): Promise<R[]> {
		const callbacks = this.events[eventName];
		if (!callbacks || callbacks.length === 0) {
			return [];
		}
		return await Promise.all(callbacks.map(async (cb) => await cb(data)));
	}
}

export const eventBus = new EventBus();