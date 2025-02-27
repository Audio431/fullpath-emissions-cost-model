export async function handleCPUUsageRequest(): Promise<MainProcessInfo> {
    const CPUInfo = await browser.myAPI.getCPUInfo();
    return CPUInfo;
}

export async function monitorCpuUsage(cpuSpikeThreshold: number): Promise<void> {
    let start = Date.now();
    let prev: { cpuTime: number, cpuCycleCount: number } | null = null;
    
    return new Promise(async (resolve, reject) => {
      const checkCpu = async () => {
        try {
          const now = Date.now();
          const NS_PER_MS = 1000 * 1000
          const deltaT = (now - start) * NS_PER_MS;

          
          const cur = await handleCPUUsageRequest().then((data) => {
            return {
              cpuTime: data.cpuTime,
              cpuCycleCount: data.cpuCycleCount
            };
          });
            
          const result = {
            timestamp: now,
            deltaT,
            totalCpu: cur.cpuTime,
            slopeCpu: (cur.cpuTime - (prev ? prev.cpuTime : 0)) / deltaT,
            cpuCycleCount: cur.cpuCycleCount,
            active: false
          };
        
          result.active = !!result.slopeCpu || cur.cpuCycleCount > (prev ? prev.cpuCycleCount : 0);
        
          if (result.slopeCpu > cpuSpikeThreshold) {
            console.warn(`CPU spike detected: ${result.slopeCpu.toFixed(3)}`);
          }
          
          prev = {
            cpuTime: cur.cpuTime,
            cpuCycleCount: cur.cpuCycleCount
          };
        
          setTimeout(checkCpu, 1000); // Check every second, adjust as needed
        } catch (error) {
          reject(error);
        }
      };

      checkCpu();
    });
}