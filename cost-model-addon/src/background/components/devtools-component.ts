import { BaseComponent } from './base-component';

export class DevToolsComponent extends BaseComponent {
	private static instance: DevToolsComponent;

	private constructor() {
		super();
	}

	public static getInstance(): DevToolsComponent {
		if (!this.instance) {
			this.instance = new DevToolsComponent();
		}
		return this.instance;
	}
}