// Trigger when the extension is installed or updated
browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
  });
  
  // Listen for tab updates (new page or page reload)
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      // Inject content script into the active tab when it's completely loaded
      browser.scripting.executeScript({
        target: { tabId: tabId },
        files: ['contentScript.js']
      }).then(() => {
        console.log('Content script injected.');
      }).catch((error) => {
        console.error('Error injecting script:', error);
      });
    }
  });
  