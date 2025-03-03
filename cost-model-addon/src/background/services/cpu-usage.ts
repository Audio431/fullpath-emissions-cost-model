import { WebSocketService } from "./client-websocket";
import { getTabOuterWindowIDs, getActiveTab, getTabFluentname } from "./tab";

export async function handleCPUUsageRequest(): Promise<MainProcessInfo> {
	const CPUInfo = await browser.myAPI.getCPUInfo();
	return CPUInfo;
}

async function getChildProcesses(): Promise<ChildProcessInfo[]> {
	const CPUInfo = await handleCPUUsageRequest();
	return CPUInfo.children;
}

async function getTabsProcesses(): Promise<(ChildProcessInfo | string)[]> {
	const children = await getChildProcesses();
	const outerWindowIDs = await getTabOuterWindowIDs();

	const tabs = await Promise.all(outerWindowIDs.map(async outerWindowId => {
		const tab = children.find(child => child.windows.some(window => window.outerWindowId === outerWindowId)) ||
			await getTabFluentname(outerWindowId)
		return tab;
	}));

	return tabs;
}

export async function getCPUUsageOfActiveTab(): Promise<{ child: ChildProcessInfo, activeTab: browser.tabs.Tab }> {

	const activeTab = await getActiveTab();

	if (!activeTab) {
		throw new Error("No active tab found");
	}

	const child = (await Promise.all(
		(await getChildProcesses()).map(child =>
			Promise.all(child.windows.map(window => getTabFluentname(window.outerWindowId)))
				.then(names => activeTab.title && names.includes(activeTab.title) ? child : null)
		)
	)).find(child => child !== null);

	if (!child) {
		throw new Error("No matching child process found for active tab");
	}

	return { child, activeTab };
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

				const { child: cpuinfo, activeTab: activeTab } = await getCPUUsageOfActiveTab();
				const cpuTime = cpuinfo.cpuTime;
				const cpuCycleCount = cpuinfo.cpuCycleCount;

				// console.log("Child original: ", cpuinfo.origin);
				// console.log("Child CPU Time: ", prev?.cpuTime);

				if (prev) {
					const elapsedNs = (now - prev.time) * 1_000_000;
					const usageRate = (cpuTime - prev.cpuTime) / elapsedNs;
					// const isActive = usageRate > 0 || cpuCycleCount > prev.cycles;

					if (usageRate > cpuSpikeThreshold) {
						dispatchEvent(new CustomEvent("cpu-spike", {
							detail: { usageRate, cpuCycleCount: cpuCycleCount, activeTab: activeTab.title }
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

			timer = setTimeout(monitorCycle, 2000);
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