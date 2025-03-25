let requests = new Map();

// Helper to update storage
const updateStorage = async (tabId) => {
  const tabRequests = requests.get(tabId) || [];
  await browser.storage.local.set({
    [`requests_${tabId}`]: tabRequests
  });
};

browser.runtime.onConnect.addListener((port) => {
  if (port.name === "devtools-page") {
    port.onMessage.addListener(async (message) => {
      if (message.name === 'networkRequest' && message.tabId) {
        const tabRequests = requests.get(message.tabId) || [];
        tabRequests.push(message.data);
        requests.set(message.tabId, tabRequests);
        await updateStorage(message.tabId);
      }
    });
  }
  
  if (port.name === "popup") {
    port.onMessage.addListener(async (message) => {
      if (message.name === "getStats") {
        try {
          // Get active tab
          const tabs = await browser.tabs.query({active: true, currentWindow: true});
          const tabId = tabs[0].id;
          
          // Get requests for current tab
          const data = await browser.storage.local.get(`requests_${tabId}`);
          const tabRequests = data[`requests_${tabId}`] || [];
          
          port.postMessage({
            requestCount: tabRequests.length,
            requestLog: tabRequests
          });
        } catch (error) {
          console.error('Error getting stats:', error);
          port.postMessage({
            requestCount: 0,
            requestLog: []
          });
        }
      }
    });
  }
});

// Clear data when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  requests.delete(tabId);
  browser.storage.local.remove(`requests_${tabId}`);
});