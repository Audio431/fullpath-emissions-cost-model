export class TabService {
    async getActiveTab(): Promise<browser.tabs.Tab | undefined> {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      return tabs[0];
    }
}