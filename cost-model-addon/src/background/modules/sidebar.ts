import { BaseComponent } from "./base";
import { IMediator } from "../mediator";
import { MessageType } from "../../common/message.types";

export class SidebarComponent extends BaseComponent {
	private static instance: SidebarComponent;
	private trackingEnabled: boolean = false;

	private constructor() {
		super();
	}

	public static getInstance(): SidebarComponent {
		if (!this.instance) {
			this.instance = new SidebarComponent();
		}
		return this.instance;
	}

	public setMediator(mediator: IMediator) {
		this.mediator = mediator;
	}

	public userToggledTracking(): void {
		this.trackingEnabled = !this.trackingEnabled;

		this.mediator.notify(this, {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: this.trackingEnabled },
		});
	}
}