// export class CpuService {
//   private static instance: CpuService;

//   private constructor() {
//     browser.runtime.onMessage.addListener((message: RuntimeMessage, sender) => {
//       if (message.type === MessageType.CPU_USAGE_REQUEST) {
//         this.handleCpuUsageRequest(message, sender);
//       }

//       return false;
//     });
//   }

//   public static getInstance(): CpuService {
//     if (!CpuService.instance) {
//       CpuService.instance = new CpuService();
//     }
//     return CpuService.instance;
//   }

//   private async handleCpuUsageRequest(message: RuntimeMessage, sender: browser.runtime.MessageSender): Promise<void> {
//     const cpuUsage = await browser.myAPI.getCPUInfo();

//     browser.runtime.sendMessage(response);
//   }
// }