const handleNetworkRequest = (request) => {
  // Create connection for each request to ensure it's alive
  const backgroundPageConnection = browser.runtime.connect({
    name: "devtools-page"
  });

  const requestData = {
    url: request.request.url,
    method: request.request.method,
    timestamp: new Date().toISOString(),
    status: request.response.status
  };

  backgroundPageConnection.postMessage({
    name: 'networkRequest',
    tabId: browser.devtools.inspectedWindow.tabId,
    data: requestData
  });

  // Close connection after sending
  setTimeout(() => backgroundPageConnection.disconnect(), 100);
};

// Initialize request listener
browser.devtools.network.onRequestFinished.addListener(handleNetworkRequest);

// Send initial connection message
const initConnection = browser.runtime.connect({
  name: "devtools-page"
});
initConnection.postMessage({
  name: 'init',
  tabId: browser.devtools.inspectedWindow.tabId
});