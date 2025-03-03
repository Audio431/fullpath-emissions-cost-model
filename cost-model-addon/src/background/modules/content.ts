import { MessageType } from '../../common/message.types';
import { getActiveTab } from '../services/tab';
import { BaseComponent } from './base';

export class ContentComponent extends BaseComponent {
    private static instance: ContentComponent;

    private constructor() {
        super();
    }

    public static getInstance(): ContentComponent {
        if (!this.instance) {
            this.instance = new ContentComponent();
        }
        return this.instance;
    }

    public updateTrackingState(state: boolean): void {
        this.mediator.notify(this, {
            type: MessageType.TRACKING_STATE,
            payload: { state }
        });
    }

    public onClicked(message: any): void {
        this.mediator.notify(this, {
            type: MessageType.CPU_USAGE,
            payload: message
        });
    }

    public async onCPUUsageRequest(CPUInfo: MainProcessInfo, outerWindowIDMap: Map<number, string>, activeTab?: browser.tabs.Tab): Promise<void> {
        return this.mediator.notify(this, {
            type: MessageType.CPU_USAGE,
            payload: {}
        });
    }
}