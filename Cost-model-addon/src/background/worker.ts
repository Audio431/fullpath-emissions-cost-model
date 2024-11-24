onmessage = function(e) {
    if (e.data === 'start') {
        // runMemoryMeasurements();
        console.log('Worker started');
    }
}

// function runMemoryMeasurements() {
//     const interval = -Math.log(Math.random()) * 5 * 60 * 1000;
//     postMessage(`Next measurement in ${Math.round(interval / 1000)} seconds.`);
//     setTimeout(measureMemory, interval);
//   }
  
// async function measureMemory() {
//   const memorySample = await performance.measureUserAgentSpecificMemory();
//   postMessage(memorySample);
//   runMemoryMeasurements();
// }
