import { MessageType } from "../../common/message.types";
import { eventBus } from "../shared/eventBus";

export class SidebarModule {
	private static instance: SidebarModule;
	private trackingEnabled: boolean = false;

	private constructor() {
		eventBus.on("TOGGLE_TRACKING", this.userToggledTracking.bind(this));
		eventBus.on ("GET_TRACKING_STATUS", this.sendTrackingStatus.bind(this));
	}

	public static getInstance(): SidebarModule {
		if (!this.instance) {
			this.instance = new SidebarModule();
		}
		return this.instance;
	}

	public userToggledTracking(message: RuntimeMessage): void {
		this.trackingEnabled = message.payload.enabled;
		console.log(`User toggled tracking to ${this.trackingEnabled}`);

		eventBus.publish("CONTENT_TOGGLE_TRACKING", {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: this.trackingEnabled }
		})
		
		eventBus.publish("DEVTOOLS_TOGGLE_TRACKING", {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: this.trackingEnabled }
		})
	}

	public sendTrackingStatus(): void {
		eventBus.publish("RESPONSE_TRACKING_STATE", {
			type: MessageType.TRACKING_STATE,
			payload: { enabled: this.trackingEnabled }
		})
	}
}