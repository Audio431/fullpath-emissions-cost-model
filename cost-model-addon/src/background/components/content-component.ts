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
    
    public async onCPUUsageResponse(CPUInfo: MainProcessInfo): Promise<void> {
      //  const childrenProcessMap : Map = new Map<ChildProcessInfo["origin"], ChildProcessInfo>();
       const children = CPUInfo.children.map((child: ChildProcessInfo) => {
          return {
            [child.origin]: {
              cpuCycleCount: child.cpuCycleCount,
              cpuTime: child.cpuTime,
              childId: child.childID,
              memory: child.memory,
              pid: child.pid,
              origin: child.origin,
              // threads: child.threads,
              // windows: child.windows,
            }
          };
       })

       getActiveTab().then((tab) => {
        console.log("Active Tab: ", tab?.id);
       });

       console.log("Children Process Map: ", children);

       const sumChildMemory = CPUInfo.children.reduce((acc: number, child: ChildProcessInfo) => {
          return acc + child.memory;
        }, 0);
    }
}