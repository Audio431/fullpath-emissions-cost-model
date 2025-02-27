export async function getActiveTab(): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

export async function getTabById(tabId: number): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return tabs.find(tab => tab.id === tabId);
}

export async function getTabByUrl(url: string): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return tabs.find(tab => tab.url === url);
}

export async function getOuterWindowID(): Promise<Map<number, string>> {
    const outerWindowIDMap = await browser.myAPI.getOuterWindowID()
    return outerWindowIDMap;
}