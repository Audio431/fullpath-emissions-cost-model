/**
 * @file This script adopts the har-export-trigger extension.
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

function onRequestFinished(request: any) {
    request.getContent().then(([
        content, 
        encoding
    ]: [string, string]) => {
        
        const responseContent = request.response.content;
        delete responseContent.comment;
        responseContent.text = content;
        
        port.postMessage({
            type: MessageType.NETWORK_DATA,
            payload: {
                tabId: browser.devtools.inspectedWindow.tabId,
                request: JSON.stringify(request),
                action: "requestFinished"
            }
           
        });

    }).catch((error: any) => {
        console.error("Error getting request content:", error);
    });
}