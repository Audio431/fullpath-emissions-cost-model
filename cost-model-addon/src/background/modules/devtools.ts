export class DevtoolsModule {
	private static instance: DevtoolsModule;

	public static getInstance(): DevtoolsModule {
		if (!this.instance) {
			this.instance = new DevtoolsModule();
		}
		return this.instance;
	}
}