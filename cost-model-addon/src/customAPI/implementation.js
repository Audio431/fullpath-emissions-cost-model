/** 
 * This privileged extension API is required to access the memory reporter.
 * firefox's about:config:
 * 1. xpinstall.signatures.required = false
 * 2. extensions.experiments.enabled = true
 */

/** 
 * Name of the API requires to be same
 * 1. variable (this.myAPI)
 * 2. return value (myAPI) in getAPI function
 * 3. browser.myAPI in background.js
 * 4. experiments_apis in manifest.json
 * 5. namespace in schema.json
 */


/** 
 * Types of the return values of the functions are defined in JSDoc comments.
 */

/**
 * ProcessInfo object
 * @typedef {Object} ProcessInfo
 * @property {number} cpuCycleCount
 * @property {number} cpuTime
 */

/**
 * ThreadsInfo object
 * @typedef {Object} ThreadsInfo
 * @extends ProcessInfo
 * @property {number} tid
 * @property {string} name
 */

/**
 * MainProcessInfo object
 * @typedef {Object} MainProcessInfo
 * @extends ProcessInfo
 * @property {ChildProcessInfo[]} children
 * @property {number} pid
 * @property {number} memory
 * @property {ThreadsInfo[]} threads
 * @property {string} type
 */

/**
 * ChildProcessInfo object
 * @typedef {Object} ChildProcessInfo
 * @extends ProcessInfo
 * @property {number} childID
 * @property {number} memory
 * @property {string} origin
 * @property {number} pid
 * @property {string} type
 * @property {threads[]} threads
 * @property {windows[]} windows
 * @property {[]} utilityActors
 */

/**
 * threads object in ChildProcessInfo
 * @typedef {Object} threads
 * @property {number} tid
 * @property {string} name
 * @property {number} cpuTime
 * @property {number} cpuKernelTime
 * @property {number} cpuCycleCount
 */

/**
 * windows object in ChildProcessInfo
 * @typedef {Object} windows
 * @property {string} documentURI
 * @property {string} documentTitle
 * @property {number} outerWindowId
 * @property {boolean} isProcessRoot
 * @property {boolean} isInProcess
 */

/**
 * utilityActors object in ChildProcessInfo
 * @typedef {Object} utilityActors
 * @property {string} actorName
 */



ChromeUtils.defineESModuleGetters(this, {
  FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
});

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

        /**
         * Retrieves CPU info via ChromeUtils.requestProcInfo().
         * @returns {Promise<MainProcessInfo>}
         */
        async getCPUInfo() {
          try {
            let main = await ChromeUtils.requestProcInfo();

            main.children = main.children.map((child) => {

              return {
                pid: child.pid,
                memory: child.memory,
                origin: child.origin,
                cpuTime: child.cpuTime,
                cpuCycleCount: child.cpuCycleCount,
                childID: child.childID,
                type: child.type,

                windows: Array.isArray(child.windows)
                  ? child.windows.map((window) => ({
                      documentURI: String(window.documentURI),
                      documentTitle: window.documentTitle,
                      outerWindowId: window.outerWindowId,
                      isProcessRoot: window.isProcessRoot,
                      isInProcess: window.isInProcess,
                    }))
                  : [],

                threads: Array.isArray(child.threads)
                  ? child.threads.map((thread) => ({
                      name: thread.name,
                      tid: thread.tid,
                      cpuTime: thread.cpuTime,
                      cpuKernelTime: thread.cpuKernelTime,
                    }))
                  : [],

                utilityActors: Array.isArray(child.utilityActors)
                  ? child.utilityActors.map((actor) => ({
                      actorName: actor.actorName,
                    }))
                  : [],
              };
            });
            
            main.threads = main.threads.map((thread) => {
              let { tid, name, cpuTime, cpuCycleCount } = thread;
              return { tid, name, cpuTime, cpuCycleCount };
            });

            return main;

          } catch (e) {
            console.error("Error in getCPU:", e);
            return e;
          }
        },

        async getOuterWindowID() {
          let tabFluentArgs = new Map();

          for (let win of Services.wm.getEnumerator("navigator:browser")) {
            let tabbrowser = win.gBrowser;
            for (let browser of tabbrowser.browsers) {
              const tab = browser.getTabBrowser().getTabForBrowser(browser);
              tabFluentArgs.set(browser.outerWindowID, tab.label);
            }
          }

          return tabFluentArgs;
        }
      },
    };
  }
};
