import { eventBus } from '../shared/eventBus';

export class ContentModule {
    private static instance: ContentModule;

    private constructor() {
        eventBus.on("CONTENT_CLICK_EVENT", this.onClicked.bind(this));
    }

    public static getInstance(): ContentModule {
        if (!this.instance) {
            this.instance = new ContentModule();
        }
        return this.instance;
    }

    public onClicked(data: { elementDetails: any}): void {
        console.log("ContentModule sees a click with details:", data.elementDetails);
    }

}