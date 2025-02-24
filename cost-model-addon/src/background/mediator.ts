import { MessagingService } from './services/messaging-service';
import { RuntimeMessage, MessageType } from '../common/message.types';
import { SidebarComponent, ContentComponent, DevToolsComponent } from './components';
// import { StateManager } from './services/state-manager';
import { getActiveTab } from './services/tab-service';

export interface IMediator {
    notify(sender: any, event: RuntimeMessage): void;
}

// state-manager.ts
export interface IAppState {
    isTracking: boolean;
    // add more as needed
}

class StateManager {
    private static instance: StateManager;
    private state: IAppState = { isTracking: false };

    private constructor() { }

    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    public getState(): IAppState {
        return this.state;
    }

    public async setState(partial: Partial<IAppState>): Promise<void> {
        this.state = { ...this.state, ...partial };
        // Optionally persist to browser.storage, if needed
        // await browser.storage.local.set({ state: this.state });
    }
}


export class BackgroundMediator implements IMediator {
    private static instance: BackgroundMediator;

    private messagingService: MessagingService;
    private stateManager: StateManager;

    private sidebarComponent: SidebarComponent;
    private devtoolsComponent: DevToolsComponent;
    private contentComponent: ContentComponent;

    private constructor() {
        this.messagingService = MessagingService.getInstance();
        this.stateManager = StateManager.getInstance();

        this.messagingService.setMessageHandler(this.handleIncomingMessage.bind(this));
        this.messagingService.setPortMessageHandler(this.handlePortMessage.bind(this));
        this.messagingService.setOnUpdateListener(this.handleOnTabUpdate.bind(this));

        this.sidebarComponent = SidebarComponent.getInstance();
        this.devtoolsComponent = DevToolsComponent.getInstance();
        this.contentComponent = ContentComponent.getInstance();

        this.sidebarComponent.setMediator(this);
        this.devtoolsComponent.setMediator(this);
        this.contentComponent.setMediator(this);
    }

    public static getInstance(): BackgroundMediator {
        if (!BackgroundMediator.instance) {
            BackgroundMediator.instance = new BackgroundMediator();
        }
        return BackgroundMediator.instance;
    }

    /**
     * The Mediator's job: handle inbound messages and route them to the correct "component" or method.
     */
    private handleIncomingMessage(message: RuntimeMessage, sender: any): void {
        switch (message.from) {

            case 'sidebar':
                if (message.type === MessageType.TOGGLE_TRACKING) {
                    this.sidebarComponent.userToggledTracking();
                }
                break;

            case 'content':
                if (message.type === MessageType.TRACKING_STATE) {
                    //   this.contentComponent.updateTrackingState(message.payload.state);
                }
                break;

            case 'devtools':
                // handle devtools messages
                break;
        }
    }

    private handlePortMessage(message: any, port: browser.runtime.Port): void {
        switch (port.name) {
            case 'content-script':
                if (message.type === MessageType.EVENT_LISTENER && message.payload.event === 'click') {
                    console.log('Received click event from content script:', message.payload.details);
                }
                if (message.type === MessageType.EVENT_LISTENER && message.payload.event === 'scroll') {
                    console.log('Received scroll event from content script:', message.payload.details);
                }
                break;
        }
    }

    private async handleOnTabUpdate(tabId: number, tab: browser.tabs.Tab): Promise<void> {

        await this.messagingService.sendToTab(tabId, {
            type: MessageType.TRACKING_STATE,
            from: 'background',
            payload: { state: this.stateManager.getState().isTracking }
        }, tab);
    }

    // Example notify pattern:
    public notify(sender: any, event: RuntimeMessage): void {
        if (sender instanceof SidebarComponent) {
            this.handleSidebarEvent(event);
        } else if (sender instanceof ContentComponent) {
            // this.handleContentEvent(event);
        } else if (sender instanceof DevToolsComponent) {
            // handle devtools event
        }
    }

    private async handleSidebarEvent(event: RuntimeMessage): Promise<void> {
        switch (event.type) {
            case MessageType.TOGGLE_TRACKING:
                const newState = !this.stateManager.getState().isTracking;
                await this.stateManager.setState({ isTracking: newState });

                const activeTab = await getActiveTab()!;
                await this.messagingService.sendToTab(activeTab?.id!, {
                    type: MessageType.TRACKING_STATE,
                    from: 'background',
                    payload: { state: newState }
                }, activeTab!);
                break;
        }
    }

    // private async handleContentEvent(event: RuntimeMessage) {
    //     switch (event.type) {
    //         case MessageType.TRACKING_STATE:
    //             await this.messagingService.sendToRuntime({
    //                 type: MessageType.TRACKING_STATE,
    //                 payload: { state: this.stateManager.getState().isTracking;}
    //             });
    //             break;
    //     }
    // }

}
