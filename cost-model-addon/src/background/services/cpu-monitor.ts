import { getTabOuterWindowIDs, getActiveTab, getTabFluentname, getActiveTabOuterWindowID, TabInfo } from "./tab";

type TabProcess = 
  | { type: 'process', data: ChildProcessInfo }
  | { type: 'name', data: string };

export async function handleCPUUsageRequest(): Promise<MainProcessInfo> {
	const CPUInfo = await browser.myAPI.getCPUInfo();
	return CPUInfo;
}

async function getChildProcesses(): Promise<ChildProcessInfo[]> {
	const CPUInfo = await handleCPUUsageRequest();
	return CPUInfo.children;
}

async function getCurrentTabsProcesses(): Promise<TabProcess[]> {
	const children = await getChildProcesses();
	const outerWindowIDs = await getTabOuterWindowIDs();
	
	const tabs = await Promise.all(outerWindowIDs.map(async outerWindowId => {
	  const childProcess = children.find(child => 
		child.windows.some(window => window.outerWindowId === outerWindowId)
	  );
	  
	  if (childProcess) {
		return { type: 'process' as const, data: childProcess };
	  } else {
		const name = await getTabFluentname(outerWindowId);
		return { type: 'name' as const, data: name };
	  }
	}));
	
	return tabs;
}

export async function getCPUUsageOfActiveTab(): Promise<{ child: ChildProcessInfo, tabInfo: TabInfo }> {

	const activeTab = await getActiveTab();
	const outerWindowID = await getActiveTabOuterWindowID();
	const children = await getChildProcesses();
	
	console.log("Current tabs processes: ", await getCurrentTabsProcesses());

	if (!activeTab) {
		throw new Error("No active tab found");
	}

	if (!outerWindowID) {
		throw new Error("No active tab outer window ID found");
	}


	const child = children.find(ch =>
		ch.windows.some(win => win.outerWindowId === outerWindowID)
	);

	const tabInfo = {
		outerWindowID,
		tabId: activeTab.id,
		title: activeTab.title,
		pid: child?.pid
	};
	  

	if (!child) {
		throw new Error("No matching child process found for active tab");
	}

	return { child , tabInfo };
}


export interface MonitorCpuUsageController {
	cancel: () => void;
	promise: Promise<void>;
}

export async function monitorCpuUsageAll(
	cpuSpikeThreshold: number = 0
  ): Promise<MonitorCpuUsageController> {
	let cancelled = false;
	let timer: ReturnType<typeof setTimeout> | null = null;
	
	// Track previous measurements for all tabs
	const prevMeasurements = new Map<number, {
	  time: number,
	  cpuTime: number,
	  cycles: number
	}>();
	
	const promise = new Promise<void>((resolve) => {
	  const monitorCycle = async () => {
		if (cancelled) {
		  resolve();
		  return;
		}
		
		try {
		  const now = Date.now();
		  const allTabProcesses = await getCurrentTabsProcesses();
		  const activeTab = await getActiveTab();
		  const activeOuterWindowID = await getActiveTabOuterWindowID();
		  
		  // Process each tab
		  for (let i = 0; i < allTabProcesses.length; i++) {
			const tabProcess = allTabProcesses[i];
			const outerWindowId = (await getTabOuterWindowIDs())[i];
			const tab = (await browser.tabs.query({}))[i];
			
			if (!tab || !tab.id) continue;
			
			// Skip if not a process
			if (tabProcess.type !== 'process') continue;
			
			const childProcess = tabProcess.data;
			const isActive = outerWindowId === activeOuterWindowID;
			
			const tabInfo = {
			  outerWindowID: outerWindowId,
			  tabId: tab.id,
			  title: tab.title || "Untitled",
			  pid: childProcess.pid,
			  isBackground: !isActive
			};
			
			// Get previous measurements
			const prev = prevMeasurements.get(tab.id);
			
			if (prev) {
			  const elapsedNs = (now - prev.time) * 1_000_000;
			  const cpuUsage = childProcess.cpuTime - prev.cpuTime;
			  const utilisation = cpuUsage / elapsedNs;
			  
			  if (utilisation > cpuSpikeThreshold) {
				if (isActive) {
				  // Use the original event for active tab
				  dispatchEvent(new CustomEvent("cpu-spike", {
					detail: { 
					  cpuUsage, 
					  tabInfo: {
						outerWindowID: tabInfo.outerWindowID,
						tabId: tabInfo.tabId,
						title: tabInfo.title,
						pid: tabInfo.pid
					  }
					}
				  }));
				} else {
				  // Use a different event for background tabs
				  dispatchEvent(new CustomEvent("background-cpu-spike", {
					detail: { cpuUsage, tabInfo }
				  }));
				}
			  }
			}
			
			// Update measurements
			prevMeasurements.set(tab.id, {
			  time: now,
			  cpuTime: childProcess.cpuTime,
			  cycles: childProcess.cpuCycleCount
			});
		  }
		} catch (error) {
		  console.error("CPU monitoring error:", error);
		}
		
		timer = setTimeout(monitorCycle, 1000);
	  };
	  
	  monitorCycle();
	});
	
	return {
	  cancel: () => {
		cancelled = true;
		if (timer !== null) clearTimeout(timer);
	  },
	  promise
	};
  }