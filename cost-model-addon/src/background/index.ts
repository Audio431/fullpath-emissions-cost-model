import { BackgroundMediator } from "./mediator";
import { monitorCpuUsage } from "./services/cpu-usage-service";

BackgroundMediator.getInstance();


browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
});
  
// browser.myAPI.getCPUInfo().then((data : MainProcessInfo) => {
//     console.log("Main Process Info: ", data);
//     console.log(data); // outputs: "Child Process: 1" "node"
//     // console.log("Thread ID: 1", data.threads); // outputs: "Thread ID: 1" 1
// });

// monitorCpuUsage(0.05);