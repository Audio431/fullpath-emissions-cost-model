const port = browser.runtime.connect({ name: "devtools" });
let listenerAdded = false;

port.postMessage("Hi from devtools");

onAddRequestListener();

function onAddRequestListener() {
    if (!listenerAdded) {
      listenerAdded = true;
      browser.devtools.network.onRequestFinished.addListener(onRequestFinished);
    }
}

// function onGetHAR(message : any) {
//     browser.devtools.network.getHAR().then((harLog: any) => {
//         port.postMessage({
//             tabId: browser.devtools.inspectedWindow.tabId,
//             har: harLog,
//             action: "getHAR",
//             actionId: message.actionId,
//         });
//     });
// }

function onRequestFinished(request: any) {
    request.getContent().then(([
        content, 
        encoding
    ]: [string, string]) => {
        
        const responseContent = request.response.content;
        delete responseContent.comment;
        responseContent.text = content;
        
        port.postMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            action: "requestFinished",
            request: JSON.stringify(request),
        });

    }).catch((error: any) => {
        console.error("Error getting request content:", error);
    });
}