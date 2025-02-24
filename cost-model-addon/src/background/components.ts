import { IMediator } from './mediator';
import { MessageType } from '../common/message.types';

export class BaseComponent {
    protected mediator: IMediator;

    constructor(mediator?: IMediator) {
        this.mediator = mediator!;
    }

    public setMediator(mediator: IMediator): void {
        this.mediator = mediator;
    }
}

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

}
