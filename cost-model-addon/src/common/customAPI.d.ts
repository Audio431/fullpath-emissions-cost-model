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
        childId: number;
        memory: number;
        origin: string;
        pid: number;
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
    }

    namespace browser {
        const myAPI: MyAPI;
    }
}

export { };
