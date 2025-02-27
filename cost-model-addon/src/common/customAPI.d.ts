declare global {
    interface ProcessInfo {
        cpuCycleCount: number;
        cpuTime: number;
    }

    interface ThreadsInfo extends ProcessInfo {
        tid: number;
        name: string;
    }

    interface ChildProcessInfo extends ProcessInfo {
        childID: number;
        memory: number;
        origin: string;
        pid: number;
        threads: threads[];
        windows: windows[];
        utilityActors: utilityActors[];
    }

    interface threads {
        tid: number;
        name: string;
        cpuTime: number;
        cpuKernelTime: number;
        cpuCycleCount: number;
    }

   interface windows {
        documentURI: string;
        documentTitle: string;
        outerWindowId: number;
        isProcessRoot: boolean;
        isInProcess: boolean;
    }

    interface utilityActors {
        actorName: string;
    }

    interface MainProcessInfo extends ProcessInfo {
        children: ChildProcessInfo[];
        pid: number;
        memory: number;
        threads: ThreadsInfo[];
        type: string;
    }

    interface MyAPI {
        getCPUInfo(): Promise<MainProcessInfo>;
        getOuterWindowID(): Promise<Map<number, string>>;
    }

    namespace browser {
        const myAPI: MyAPI;
    }
}

export { };
