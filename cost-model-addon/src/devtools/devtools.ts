/**
 * @fileOverview This script adopts the har-export-trigger extension.
 * @see {@link https://github.com/firefox-devtools/har-export-trigger|har-export-trigger GitHub repository}
 */

import { MessageType } from '../common/message.types';

let port: browser.runtime.Port;

port = browser.runtime.connect({ name: "devtools" });

port.postMessage({ type: MessageType.REQUEST_TRACKING_STATE });

port.onMessage.addListener((message: any) => {
    switch (message.type) {
        case MessageType.TRACKING_STATE:
            if (message.payload.state) {
                browser.devtools.network.onRequestFinished.addListener(onRequestFinished);

            } else {
                browser.devtools.network.onRequestFinished.removeListener(onRequestFinished);
            }
            break;
        case "REQUEST_TAB_ID":
            port.postMessage({ type: "TAB_ID", tabId: browser.devtools.inspectedWindow.tabId });
            break;
    }
});

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