import { BackgroundMediator } from "./mediator";
import { DevtoolsModule, SidebarModule, ContentModule } from "./modules";

(async () => {

    function GenerateGuid() {
        if (self && self.crypto && typeof self.crypto.randomUUID === 'function') {
            return self.crypto.randomUUID();
        }
        else {
            const array = new Uint32Array(10);
            return self.crypto.getRandomValues(array);
        }
    }

    const clientId = GenerateGuid() as string;
    localStorage.setItem('clientId', clientId);

    BackgroundMediator.getInstance();

    SidebarModule.getInstance();
    ContentModule.getInstance();
    DevtoolsModule.getInstance();

    browser.action.onClicked.addListener(() => {
        browser.sidebarAction.open();
    });
    
})();