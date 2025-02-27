import { WebSocketService } from "./client-websocket";

export async function handleCPUUsageRequest(): Promise<MainProcessInfo> {
    const CPUInfo = await browser.myAPI.getCPUInfo();
    return CPUInfo;
}

export interface MonitorCpuUsageController {
  cancel: () => void;
  promise: Promise<void>;
}

export function monitorCpuUsage(cpuSpikeThreshold: number): MonitorCpuUsageController {
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
        const { cpuTime, cpuCycleCount } = await handleCPUUsageRequest();
        
        if (prev) {
          const elapsedNs = (now - prev.time) * 1_000_000;
          const usageRate = (cpuTime - prev.cpuTime) / elapsedNs;
          // const isActive = usageRate > 0 || cpuCycleCount > prev.cycles;

          
          if (usageRate > cpuSpikeThreshold) {
            dispatchEvent(new CustomEvent("cpu-spike", { 
              detail: { usageRate, cpuCycleCount: cpuCycleCount } 
            }));
          }
        }
        
        prev = { time: now, cpuTime, cycles: cpuCycleCount };
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
      if (timer!== null) clearTimeout(timer);
    },
    promise
  };
}