export class PortManager {
    private static instance: PortManager;
    private ports: Map<number, browser.runtime.Port>;
  
    private constructor() {
      this.ports = new Map();
    }
  
    static getInstance(): PortManager {
      if (!PortManager.instance) {
        PortManager.instance = new PortManager();
      }
      return PortManager.instance;
    }
  
    registerPort(tabId: number, port: browser.runtime.Port): void {
      this.ports.set(tabId, port);
      this.setupPortDisconnectListener(tabId, port);
    }
  
    private setupPortDisconnectListener(tabId: number, port: browser.runtime.Port): void {
      port.onDisconnect.addListener(() => {
        this.ports.delete(tabId);
        console.log(`Port for tab ${tabId} disconnected`);
      });
    }
  
    getPort(tabId: number): browser.runtime.Port | undefined {
      return this.ports.get(tabId);
    }
}
  