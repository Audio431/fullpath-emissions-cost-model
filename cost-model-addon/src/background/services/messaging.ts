type MessageCallback = (message: RuntimeMessage, sender: any, sendResponse: (response?: any) => void) => void;
type PortMessageCallback = (message: RuntimeMessage, port: browser.runtime.Port) => void;
type TabCallback = (tabId:number, changeInfo: any, tab: browser.tabs.Tab,) => void;
type PortConnectionCallback = (port: browser.runtime.Port) => void;

export class MessagingService {
    private static instance: MessagingService;

    private callback?: MessageCallback;
    private portCallback?: PortMessageCallback;
    private portConnectionCallback?: PortConnectionCallback;
    private portDisconnectCallback?: PortConnectionCallback
    private updateCallback?: TabCallback;
    private updateActiveTabCallback?: TabCallback;

    private constructor() {
        browser.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
            if (this.callback) {
                this.callback(message, sender, sendResponse);
                // Return true to signal that sendResponse will be called asynchronously.
                return true;
            }
            return false;
        });
        

        browser.runtime.onConnect.addListener((port) => {
            console.log(`[MessagingService] Port connected: ${port.name} (tabId: ${port.sender?.tab?.id})`);
            this.portConnectionCallback && this.portConnectionCallback(port);

            port.onMessage.addListener((message: any) => {
                this.portCallback && this.portCallback(message, port);
            });

            port.onDisconnect.addListener(() => {
                console.log(`[MessagingService] Port connected: ${port.name} (tabId: ${port.sender?.tab?.id})`);
                this.portDisconnectCallback && this.portDisconnectCallback(port);
            });
        });

        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // Don't use changeInfo.status === 'complete' because it's not always reliable
            this.updateCallback && this.updateCallback(tabId, changeInfo, tab);
        });

        browser.tabs.onActivated.addListener((activeInfo) => {
            this.updateActiveTabCallback && this.updateActiveTabCallback(activeInfo.tabId, {}, {} as browser.tabs.Tab);
        });
    }

    public static getInstance(): MessagingService {
        if (!MessagingService.instance) {
            MessagingService.instance = new MessagingService();
        }
        return MessagingService.instance;
    }

    public setMessageHandler(callback: MessageCallback): void {
        this.callback = callback;
    }

    public setOnUpdateListener(callback: TabCallback): void {
        this.updateCallback = callback;
    }

    public setPortMessageHandler(callback: PortMessageCallback): void {
        this.portCallback = callback;
    }

    public setPortConnectionHandler(callback: PortConnectionCallback): void {
        this.portConnectionCallback = callback;
    }

    public setPortDisconnectionHandler(callback: PortConnectionCallback): void {
        this.portDisconnectCallback = callback;
    }

    public setOnTabUpdateListener(callback: TabCallback): void {
        this.updateCallback = callback;
    }

    public setOnActiveTabUpdateListener(callback: TabCallback): void {
        this.updateActiveTabCallback = callback;
    }

    public async sendToTab(tab: browser.tabs.Tab, msg: RuntimeMessage, retries: number = 5): Promise<void> {
        try {
            if (!tab.id) {
                console.error('[MessagingService] Cannot send message to tab with undefined id');
                return;
            }
            
            const response = await browser.tabs.sendMessage(tab.id, msg);
            
            if (response) {
                console.log('[MessagingService] Response from tab:', response);
            }

            return Promise.resolve();
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage === 'Could not establish connection. Receiving end does not exist.') {
                if (retries > 0) {
                    console.log(`[MessagingService] Tab is not ready yet: ${tab.url}. Retrying in 1 second... (Attempts left: ${retries})`);
                    setTimeout(() => {
                        this.sendToTab(tab, msg, retries - 1);
                    }, 1000);
                } else {
                    console.error(`[MessagingService] Failed to send message to tab ${tab.id} after multiple attempts.`);
                }
            } else {
                console.error('[MessagingService] Error sending message to tab:', error);
            }

            return Promise.reject(error);
        }
    }

    public async sendToRuntime(msg: RuntimeMessage): Promise<void> {
        await browser.runtime.sendMessage(msg).then((response) => {
            response && console.log('Response from runtime:', response);
        }).catch((error) => {
            console.error('Error sending message to runtime:', error);
        });
    }

    public async sendPortMessage(port: browser.runtime.Port, msg: any): Promise<void> {
        // console.log('[MessagingService] sending message to port:', port.name);
        port.postMessage(msg);
    }
}