import { BackgroundMediator } from "./mediator";

BackgroundMediator.getInstance();

browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
});