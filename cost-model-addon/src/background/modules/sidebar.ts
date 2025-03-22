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

	public async userToggledTracking(newState: boolean): Promise<{ contentNotified: boolean, devtoolsNotified: boolean }> {
		this.trackingEnabled = newState;

		const trackingMessage = {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: this.trackingEnabled }
		};
		
		const [response] = await eventBus.publish("RESPONSE_TOGGLE", trackingMessage);
		return response;
	}
	public async sendTrackingStatus(): Promise<void> {
		await eventBus.publish("RESPONSE_TRACKING_STATE", {
			type: MessageType.TRACKING_STATE,
			payload: { enabled: this.trackingEnabled }
		})
	}
}