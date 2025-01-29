// let myWorker: Worker;
// let isChromium = window.chrome;

async function performMemoryMeasurement() {
    if (!window.crossOriginIsolated) {
        console.log('performance.measureUserAgentSpecificMemory() is only available in cross-origin-isolated pages');
      } else if (!performance.measureUserAgentSpecificMemory) {
        console.log('performance.measureUserAgentSpecificMemory() is not available in this browser');
      } else {
        let result;
        try {
          result = await performance.measureUserAgentSpecificMemory();
        } catch (error) {
            console.log('An error occurred:', error);
          if (error instanceof DOMException && error.name === 'SecurityError') {
            console.log('The context is not secure.');
          } else {
            console.log('An error occurred:', error);
            throw error;
          }
        }
        console.log(result);
      }
}

function scheduleMeasurement() {
    // Check measurement API is available.
    // if (!chrome.windows.crossOriginIsolated) {
    //   console.log('performance.measureUserAgentSpecificMemory() is only available in cross-origin-isolated pages');
    //   console.log('See https://web.dev/coop-coep/ to learn more')
    //   return;
    // }
    if (!performance) {
        console.log('performance');
        return;
    }
    if (!performance.measureUserAgentSpecificMemory) {
      console.log('performance.measureUserAgentSpecificMemory() is not available in this browser');
      return;
    }
    const interval = measurementInterval();
    console.log(`Running next memory measurement in ${interval} seconds`);
    setTimeout(performMeasurement, interval);
  }

function measurementInterval() {
    const MEAN_INTERVAL_IN_MS = 30 * 1000;
    return MEAN_INTERVAL_IN_MS;
}

async function performMeasurement() {
    // 1. Invoke performance.measureUserAgentSpecificMemory().
    let result;
    try {
      result = await performance.measureUserAgentSpecificMemory();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.log('The context is not secure.');
        return;
      }
      // Rethrow other errors.
      throw error;
    }
    // 2. Record the result.
    console.log('Memory usage:', result);
    // 3. Schedule the next measurement.
    scheduleMeasurement();
  }


  // Start measurements.
performance.mark('start');
scheduleMeasurement();



async function handleOnMessage(message: any, sender: any, sendResponse: any) {
    if (message.data === "start testing performance") {
        console.log(message.data + " message received");
        // myWorker = new Worker(new URL('./worker.ts', import.meta.url));
        // if (myWorker) {
        //     myWorker.postMessage('start');

        //     myWorker.onmessage = function (e) {
        //         console.log('Worker response:', e.data);
        //     }

        //     myWorker.onerror = function (err) {
        //         console.error('Worker error:', err.message);
        //     };
       
        // }

        // try {
        //     // Simulate an async operation
        //     const result = await performMemoryMeasurement();
        //     sendResponse({ success: true, data: result });
        // } catch (error) {
        //     sendResponse({ success: false, error: chrome.runtime.lastError });
        // }

    }
}

// if (isChromium) {
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        (async () => {
        handleOnMessage(message, sender, sendResponse);
        })()

        return true; // Keeps the message channel open for async responses
});
// }
// } else {
//     browser.runtime.onMessage.addListener((message) => {
//         handleOnMessage(message, null, null);
//     });
// }
