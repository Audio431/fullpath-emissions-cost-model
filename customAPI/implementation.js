ChromeUtils.defineESModuleGetters(this, {
    FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
});

this.myAPI = class extends ExtensionAPI {
    getAPI(context) {
        return {
            myAPI: {
                getData: () => {
                    console.log("customAPI.getData() called");
                    return 1 + 2;
                }
            }
        };
    }
};