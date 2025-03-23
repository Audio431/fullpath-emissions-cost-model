export interface TabInfo {
    outerWindowID: number | undefined;
    tabId: number | undefined;
    title: string | undefined;
    pid: number | undefined;
}

export async function getActiveTab(): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

export async function getActiveTabId(): Promise<number | undefined> {  
    const tab = await getActiveTab();
    return tab?.id;
}

export async function getTabById(tabId: number): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return tabs.find(tab => tab.id === tabId);
}

export async function getTabByUrl(url: string): Promise<browser.tabs.Tab | undefined> {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return tabs.find(tab => tab.url === url);
}

export async function getTabFluentname(outerWindowId: number): Promise<string> {
    const outerWindowIDMap = await browser.myAPI.getTabOuterWindowIDs();
    return outerWindowIDMap.get(outerWindowId) || '';
}

export async function getTabOuterWindowIDs(): Promise<Array<number>> {
    const outerWindowIds = await browser.myAPI.getTabOuterWindowIDs();
    return Array.from(outerWindowIds.keys());
}

export async function getActiveTabOuterWindowID(): Promise<number | undefined> {
    return await browser.myAPI.getActiveTabOuterWindowID();
}