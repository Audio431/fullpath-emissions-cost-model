ChromeUtils.defineESModuleGetters(this, {
    FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
});

/* This privileged extension API is required to access the memory reporter.
* firefox's about:config:
* 1. xpinstall.signatures.required = false
* 2. extensions.experiments.enabled = true
*/

/* Name of the API requires to be same
* 1. variable (this.myAPI)
* 2. return value (myAPI) in getAPI function
* 3. browser.myAPI in background.js
* 4. experiments_apis in manifest.json
* 5. namespace in schema.json
*/


// if error occured in this function, function missing error will be thrown
this.myAPI = class extends ExtensionAPI {
    getAPI(context) {
        return {
            // if error occured in this function, catch block in background.js will be executed
            myAPI: {
                add(x, y) {
                    return x + y;
                },

                getData() {
                    let gMgr = Cc["@mozilla.org/memory-reporter-manager;1"].getService(
                        Ci.nsIMemoryReporterManager
                    );

                    // const kinds = {
                    //     KIND_NONHEAP: Ci.nsIMemoryReporter.KIND_NONHEAP,
                    //     KIND_HEAP: Ci.nsIMemoryReporter.KIND_HEAP,
                    //     KIND_OTHER: Ci.nsIMemoryReporter.KIND_OTHER,
                    //   };
          
                    //   const units = {
                    //     UNITS_BYTES: Ci.nsIMemoryReporter.UNITS_BYTES,
                    //     UNITS_COUNT: Ci.nsIMemoryReporter.UNITS_COUNT,
                    //     UNITS_COUNT_CUMULATIVE: Ci.nsIMemoryReporter.UNITS_COUNT_CUMULATIVE,
                    //     UNITS_PERCENTAGE: Ci.nsIMemoryReporter.UNITS_PERCENTAGE,
                    //   };

                    return new Promise((resolve, reject) => {
                        let memoryData = [];
                        
                        try {
                            gMgr.getReports(
                                function handleReport(aProcess, aPath, aKind, aUnits, aAmount, aDescription) {
                                    
                                    let process = aProcess ? aProcess : 
                                    "Main Process (pid " + Services.appinfo.processID + ")";

                                    memoryData.push({
                                        process: process,
                                        amount: aAmount,
                                        units: aUnits,
                                        path: aPath,
                                        description: aDescription,
                                        kind: aKind
                                    });
                                },
                                null,
                                function complete() {
                                    resolve({
                                        measurements: memoryData,
                                        timestamp: new Date().toISOString()
                                    });
                                },
                                function error(e) {
                                    reject(e);
                                },
                                false  // anonymize
                            );
                        } catch (e) {
                            reject(e);
                        }
                    });

                    // return {kinds, units};
                    },
                },

            }
        };
};

