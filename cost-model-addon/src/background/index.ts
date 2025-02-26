import { BackgroundMediator } from "./mediator";

BackgroundMediator.getInstance();

browser.myAPI.getCPUInfo().then((data : MainProcessInfo) => {
    console.log(data); // outputs: "Child Process: 1" "node"
    console.log("Thread ID: 1", data.threads); // outputs: "Thread ID: 1" 1
});