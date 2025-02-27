import { BaseComponent } from "./base-component";
import { IMediator } from "../mediator";
import { MessageType } from "../../common/message.types";

export class SidebarComponent extends BaseComponent {
	private static instance: SidebarComponent;

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
		// Something triggered in the sidebar script (via message or UI event).
		// Let's notify the Mediator about it:
		// console.log("User toggled tracking in sidebar");
		this.mediator.notify(this, {
			type: MessageType.TOGGLE_TRACKING,
			payload: { enabled: true }
		});
	}
}