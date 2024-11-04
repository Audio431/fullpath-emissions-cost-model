browser.runtime.onMessage.addListener((message) => {
    if (message.data === "start testing performance") {
        console.log("message received");
        // startTestingPerformance();
    }
});
