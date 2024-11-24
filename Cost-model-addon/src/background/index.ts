let myWorker: Worker;
let isChromium = window.chrome;

if (isChromium) {
    chrome.runtime.onMessage.addListener((message) => {

        if (message.data === "start testing performance") {
    
            console.log(message.data + " message received");
            myWorker = new Worker(new URL('./worker.ts', import.meta.url));
            if (myWorker && crossOriginIsolated) {
              myWorker.postMessage('start');
    
              myWorker.onmessage = function (e) {
                console.log('Worker response:', e.data);
              }
        
              myWorker.onerror = function (err) {
                console.error('Worker error:', err.message);
              };
            }
        }    
    
    });
} else {

    browser.runtime.onMessage.addListener((message) => {

    if (message.data === "start testing performance") {

        console.log(message.data + " message received");
        myWorker = new Worker(new URL('./worker.ts', import.meta.url));
        if (myWorker && crossOriginIsolated) {
            myWorker.postMessage('start');

            myWorker.onmessage = function (e) {
            console.log('Worker response:', e.data);
            }

            myWorker.onerror = function (err) {
            console.error('Worker error:', err.message);
            };
        }
    }    

    });
}