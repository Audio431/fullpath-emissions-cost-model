const port = browser.runtime.connect({
  name: "popup"
});

// Request initial stats
port.postMessage({
  name: "getStats"
});

// Listen for updates from background
port.onMessage.addListener(function(message) {
  document.getElementById('requestCount').textContent = message.requestCount;
  
  const logContainer = document.getElementById('requestLog');
  logContainer.innerHTML = '';
  
  message.requestLog.forEach(request => {
    const div = document.createElement('div');
    div.className = 'request-item';
    div.textContent = `${request.method} ${request.url} (${request.timestamp})`;
    logContainer.appendChild(div);
  });
});