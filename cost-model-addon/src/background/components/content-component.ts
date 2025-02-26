import { MessageType } from '../../common/message.types';
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
  
}