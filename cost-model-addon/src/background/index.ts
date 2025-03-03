import { BackgroundMediator } from "./mediator";
import { DevtoolsModule, SidebarModule, ContentModule } from "./modules";

(async () => {

    BackgroundMediator.getInstance();

    SidebarModule.getInstance();
    ContentModule.getInstance();
    DevtoolsModule.getInstance();

    browser.action.onClicked.addListener(() => {
        browser.sidebarAction.open();
    });
    
})();