// var s = document.createElement('script');
// // must be listed in web_accessible_resources in manifest.json
// s.src = chrome.runtime.getURL('injected.js');
// s.onload = function() {
//     this.remove();
// };
// (document.head || document.documentElement).appendChild(s);

// // Listen for messages from the injected script.
// window.addEventListener('message', function(event) {
//     // Only accept messages from the same window.
//     if (event.source !== window) return;
  
//     if (event.data && event.data.type === 'XHR_INTERCEPT') {
//       console.log('Intercepted XHR:', event.data.data);
//       // Here you can forward the data to your background script if needed.
//     }
  
//     if (event.data && event.data.type === 'FETCH_INTERCEPT') {
//       console.log('Intercepted Fetch:', event.data.data);
//       // Process or forward the fetch data as needed.
//     }
// });