// (function() {
//     // ---- Intercept XMLHttpRequest ----
//     const origXHR = XMLHttpRequest.prototype;
//     const origOpen = origXHR.open;
//     const origSend = origXHR.send;
//     const origSetRequestHeader = origXHR.setRequestHeader;
  
//     origXHR.open = function(method, url) {
//       this._method = method;
//       this._url = url;
//       this._requestHeaders = {};
//       this._startTime = new Date().toISOString();
//       return origOpen.apply(this, arguments);
//     };
  
//     origXHR.setRequestHeader = function(header, value) {
//       this._requestHeaders[header] = value;
//       return origSetRequestHeader.apply(this, arguments);
//     };
  
//     origXHR.send = function(postData) {
//       if (postData && typeof postData === 'string') {
//         this._requestBody = postData;
//       }
//       this.addEventListener('load', function() {
//         const responseHeaders = this.getAllResponseHeaders();
//         const xhrData = {
//           url: this._url,
//           method: this._method,
//           requestHeaders: this._requestHeaders,
//           requestBody: this._requestBody || null,
//           responseHeaders: responseHeaders,
//           responseBody: this.responseText,
//           startTime: this._startTime,
//           endTime: new Date().toISOString()
//         };
//         // Post data to the content script.
//         window.postMessage({ type: 'XHR_INTERCEPT', data: xhrData }, '*');
//       });
//       return origSend.apply(this, arguments);
//     };
  
//     // ---- Intercept Fetch API ----
//     const originalFetch = window.fetch;
//     window.fetch = function(input, init) {
//       // Capture fetch request details.
//       const fetchRequest = {
//         url: typeof input === 'string' ? input : input.url,
//         method: (init && init.method) || (typeof input !== 'string' && input.method) || 'GET',
//         requestHeaders: init && init.headers,
//         requestBody: init && init.body
//       };
  
//       return originalFetch(input, init).then(function(response) {
//         const clonedResponse = response.clone();
//         clonedResponse.text().then(function(bodyText) {
//           const fetchData = {
//             url: response.url,
//             status: response.status,
//             statusText: response.statusText,
//             responseHeaders: Array.from(response.headers.entries()),
//             responseBody: bodyText,
//             request: fetchRequest,
//             timestamp: new Date().toISOString()
//           };
//           // Post fetch details to the content script.
//           window.postMessage({ type: 'FETCH_INTERCEPT', data: fetchData }, '*');
//         });
//         return response;
//       });
//     };
//   })();
(function () {
    document.addEventListener("GET_HAR", () => {
        console.log("Injected Script: GET_HAR event detected!");
        chrome.runtime.sendMessage({ action: "GET_HAR" });
    });
})();
 