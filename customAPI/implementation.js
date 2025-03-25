ChromeUtils.defineESModuleGetters(this, {
    FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
});

this.myAPI = class extends ExtensionAPI {
    getAPI(context) {
        return {
            myAPI: {
                async add(x, y) {
                  return x + y;
                },
        
                async getData() {
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
                        function handleReport(
                          aProcess,
                          aPath,
                          aKind,
                          aUnits,
                          aAmount,
                          aDescription
                        ) {
                          let process = aProcess
                            ? aProcess
                            : "Main Process (pid " + Services.appinfo.processID + ")";
        
                          memoryData.push({
                            process: process,
                            amount: aAmount,
                            units: aUnits,
                            path: aPath,
                            description: aDescription,
                            kind: aKind,
                          });
                        },
                        null,
                        function complete() {
                          resolve({
                            measurements: memoryData,
                            timestamp: new Date().toISOString(),
                          });
                        },
                        function error(e) {
                          reject(e);
                        },
                        false // anonymize
                      );
                    } catch (e) {
                      reject(e);
                    }
                  });
                  // return {kinds, units};
                },
            },
        };
    }
};