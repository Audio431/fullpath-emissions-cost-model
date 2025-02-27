import { MessageType } from '../../common/message.types';
import { getActiveTab } from '../services/tab-service';
import { BaseComponent } from './base-component';

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
            type: MessageType.CPU_USAGE_REQUEST,
            payload: message
        });
    }

    public async onCPUUsageRequest(CPUInfo: MainProcessInfo, outerWindowIDMap: Map<number, string>, activeTab?: browser.tabs.Tab): Promise<void> {

        const children = CPUInfo.children.filter((child: ChildProcessInfo) =>
            child.windows.some(window => outerWindowIDMap.has(window.outerWindowId))
        );

        const matchingEntry = Array.from(outerWindowIDMap.entries()).find(([id]) =>
            children.some(child =>
                child.windows.some(window => window.outerWindowId === id)
            )
        );

        const tabFluentName = matchingEntry ? matchingEntry[1] : undefined;

        return this.mediator.notify(this, {
            type: MessageType.CPU_USAGE_RESPONSE,
            payload: { tabFluentName }
        });
    }
}