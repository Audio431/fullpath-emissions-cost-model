import { getTabOuterWindowIDs, getActiveTab, getTabFluentname, getActiveTabOuterWindowID, TabInfo } from "./tab";

export async function handleCPUUsageRequest(): Promise<MainProcessInfo> {
	const CPUInfo = await browser.myAPI.getCPUInfo();
	return CPUInfo;
}

async function getChildProcesses(): Promise<ChildProcessInfo[]> {
	const CPUInfo = await handleCPUUsageRequest();
	return CPUInfo.children;
}

async function getCurrentTabsProcesses(): Promise<(ChildProcessInfo | string)[]> {
	const children = await getChildProcesses();
	const outerWindowIDs = await getTabOuterWindowIDs();

	const tabs = await Promise.all(outerWindowIDs.map(async outerWindowId => {
		const tab = children.find(child => child.windows.some(window => window.outerWindowId === outerWindowId)) ||
			await getTabFluentname(outerWindowId)
		return tab;
	}));

	return tabs;
}

export async function getCPUUsageOfActiveTab(): Promise<{ child: ChildProcessInfo, tabInfo: TabInfo }> {

	const activeTab = await getActiveTab();
	const outerWindowID = await getActiveTabOuterWindowID();
	const children = await getChildProcesses();
	
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

export async function monitorCpuUsageActive(cpuSpikeThreshold: number): Promise<MonitorCpuUsageController> {
	let cancelled = false;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let prev: { time: number, cpuTime: number, cycles: number } | null = null;

	const promise = new Promise<void>((resolve) => {

		const monitorCycle = async () => {
			if (cancelled) {
				resolve();
				return;
			}

			try {
				const now = Date.now();

				const { child: cpuinfo, tabInfo: tabInfo } = await getCPUUsageOfActiveTab();
				const cpuTime = cpuinfo.cpuTime;
				const cpuCycleCount = cpuinfo.cpuCycleCount;

				// console.log("Child original: ", cpuinfo.origin);
				// console.log("Child CPU Time: ", prev?.cpuTime);

				if (prev) {
					const elapsedNs = (now - prev.time) * 1_000_000;
					const cpuUsage = cpuTime - prev.cpuTime;
					const utilisation = (cpuTime - prev.cpuTime) / elapsedNs;
					// const isActive = usageRate > 0 || cpuCycleCount > prev.cycles;

					if (utilisation > cpuSpikeThreshold) {
						dispatchEvent(new CustomEvent("cpu-spike", {
							detail: { cpuUsage, tabInfo }
						}));
					}

					// addEventListener('cpu-clicked', (event) => {
					// 	const customEvent = event as CustomEvent<{}>;
					// 	console.log('CPU Usage on click:', usageRate);
					// });
				}

				prev = { time: now, cpuTime, cycles: cpuCycleCount };
			} catch (error) {
				// console.error("CPU monitoring error:", error);
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