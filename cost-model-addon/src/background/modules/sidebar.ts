import { MessageType } from "../../common/message.types";
import { eventBus } from "../shared/eventBus";

export class SidebarModule {
	private static instance: SidebarModule;
	private trackingEnabled: boolean = false;

	private constructor() {
		eventBus.on("TOGGLE_TRACKING", this.userToggledTracking.bind(this));
	}

	public static getInstance(): SidebarModule {
		if (!this.instance) {
			this.instance = new SidebarModule();
		}
		return this.instance;
	}

	public userToggledTracking(): void {
		this.trackingEnabled = !this.trackingEnabled;

		eventBus.publish("SIDEBAR_TOGGLE_TRACKING", {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: this.trackingEnabled }
		  })
	}
}