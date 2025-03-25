// /**
//  * Production-ready HAR generation module.
//  * This background script listens to webRequest events, supplements data via the Resource Timing API,
//  * builds a HAR log per the HAR 1.2 spec, and provides helper functions to update page sections and
//  * retrieve the final HAR.
//  */

// Top-level HAR log object.
const harLog = {
  log: {
    version: "1.2",
    creator: { name: "My HAR Extension", version: "1.0" },
    browser: { name: navigator.userAgent, version: "unknown" },
    pages: [
      {
        id: "page_1",
        startedDateTime: new Date().toISOString(),
        title: "Page Title", // Can be updated dynamically.
        pageTimings: { onContentLoad: -1, onLoad: -1 },
      },
    ],
    entries: [],
  },
};

// In-memory store for intercepted requests keyed by requestId.
const requestStore = {};

/* ----- Utility Functions ----- */

// Parse "Cookie" header into an array of cookie objects.
function parseCookies(cookieHeader) {
  const cookies = [];
  if (!cookieHeader) return cookies;
  cookieHeader.split(/;\s*/).forEach((pair) => {
    const [name, ...valueParts] = pair.split("=");
    const value = valueParts.join("=");
    if (name && value !== undefined) {
      cookies.push({
        name: name.trim(),
        value: value.trim(),
        path: "",
        domain: "",
      });
    }
  });
  return cookies;
}

// Parse "Set-Cookie" headers into an array of cookie objects.
function parseSetCookies(setCookieHeaders) {
  const cookies = [];
  if (!Array.isArray(setCookieHeaders)) return cookies;
  setCookieHeaders.forEach((header) => {
    const parts = header.split(";").map((p) => p.trim());
    if (parts.length) {
      const [nameVal, ...attributes] = parts;
      const [name, ...valueParts] = nameVal.split("=");
      const value = valueParts.join("=");
      const cookie = { name, value, path: "", domain: "" };
      attributes.forEach((attr) => {
        const [attrName, ...attrValueParts] = attr.split("=");
        const attrValue = attrValueParts.join("=");
        if (attrName.toLowerCase() === "path") cookie.path = attrValue;
        else if (attrName.toLowerCase() === "domain") cookie.domain = attrValue;
      });
      cookies.push(cookie);
    }
  });
  return cookies;
}

// Extract query parameters from a URL into an array.
function getQueryParams(url) {
  const queryArray = [];
  try {
    const urlObj = new URL(url);
    for (const [name, value] of urlObj.searchParams.entries()) {
      queryArray.push({ name, value });
    }
  } catch (e) {
    console.error("Invalid URL in getQueryParams:", url, e);
  }
  return queryArray;
}

// Calculate an approximate header size.
function calculateHeadersSize(headers) {
  if (!headers) return -1;
  return headers.reduce(
    (size, header) => size + header.name.length + header.value.length + 4,
    0
  );
}

// Retrieve Resource Timing data for a given URL.
// In production, you should forward these entries from a content script.
function getResourceTiming(url) {
  const entries = performance.getEntries();
  console.log("Entries:", entries);
  // try {
  //   const resources = performance.getEntriesByType("resource");
  //   console.log("Resources:", resources);
  //   return resources.find((entry) => entry.name === url);
  // } catch (e) {
  //   console.warn("Resource Timing not available", e);
  //   return null;
  // }
}

/* ----- Page Section Helpers ----- */

/**
 * Updates or creates a page section in the HAR log.
 *
 * @param {string} pageId - The unique identifier for the page.
 * @param {Object} options - Optional fields:
 *   - title: {string} The page title.
 *   - startedDateTime: {string} ISO timestamp for page start.
 *   - onContentLoad: {number} Content load timing in ms.
 *   - onLoad: {number} Onload timing in ms.
 * @returns {Object} The updated/created page object.
 */
function updatePageSection(pageId, options = {}) {
  let page = harLog.log.pages.find((p) => p.id === pageId);
  if (!page) {
    page = {
      id: pageId,
      startedDateTime: options.startedDateTime || new Date().toISOString(),
      title: options.title || "",
      pageTimings: {
        onContentLoad:
          options.onContentLoad !== undefined ? options.onContentLoad : -1,
        onLoad: options.onLoad !== undefined ? options.onLoad : -1,
      },
    };
    harLog.log.pages.push(page);
  } else {
    if (options.startedDateTime) page.startedDateTime = options.startedDateTime;
    if (options.title) page.title = options.title;
    if (options.onContentLoad !== undefined)
      page.pageTimings.onContentLoad = options.onContentLoad;
    if (options.onLoad !== undefined) page.pageTimings.onLoad = options.onLoad;
  }
  return page;
}

/**
 * Returns the final HAR log.
 * Warns if there are still pending requests.
 */
function getFinalHAR() {
  if (Object.keys(requestStore).length > 0) {
    console.warn("Some requests are still pending; HAR log may be incomplete.");
  }
  return harLog;
}

/* ----- WebRequest Event Listeners ----- */

// onBeforeRequest: Capture initial request details.
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    requestStore[details.requestId] = {
      startedDateTime: new Date().toISOString(),
      request: {
        url: details.url,
        method: details.method,
        postData:
          details.requestBody && details.requestBody.raw ? "raw data" : null,
        headers: [],
        cookies: [],
      },
      response: null,
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: -1,
        wait: -1,
        receive: -1,
        ssl: -1,
      },
    };
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// onSendHeaders: Capture request headers and parse cookies.
browser.webRequest.onSendHeaders.addListener(
  (details) => {
    const store = requestStore[details.requestId];
    if (store) {
      store.request.headers = details.requestHeaders;
      const cookieHeader = details.requestHeaders.find(
        (header) => header.name.toLowerCase() === "cookie"
      );
      store.request.cookies = parseCookies(
        cookieHeader ? cookieHeader.value : ""
      );
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// onHeadersReceived: Capture response headers and parse Set-Cookie values.
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    const store = requestStore[details.requestId];
    if (store) {
      store.response = {
        status: details.statusCode,
        statusText: details.statusLine,
        headers: details.responseHeaders,
        cookies: [],
      };
      const setCookieHeaders = details.responseHeaders
        .filter((header) => header.name.toLowerCase() === "set-cookie")
        .map((header) => header.value);
      store.response.cookies = parseSetCookies(setCookieHeaders);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// onCompleted: Finalize the HAR entry.
browser.webRequest.onCompleted.addListener(
  (details) => {
    const data = requestStore[details.requestId];
    if (!data) return;
    const endTime = new Date();
    const startTime = new Date(data.startedDateTime);
    const totalTime = endTime - startTime;

    // Supplement with Resource Timing data if available.
    const timingEntry = getResourceTiming(data.request.url);
    if (timingEntry) {
      data.timings.blocked = timingEntry.startTime - timingEntry.fetchStart;
      data.timings.dns =
        timingEntry.domainLookupEnd - timingEntry.domainLookupStart;
      data.timings.connect = timingEntry.connectEnd - timingEntry.connectStart;
      data.timings.ssl =
        timingEntry.secureConnectionStart > 0
          ? timingEntry.connectEnd - timingEntry.secureConnectionStart
          : -1;
      data.timings.send = timingEntry.responseStart - timingEntry.requestStart;
      data.timings.wait = timingEntry.responseStart - timingEntry.startTime;
      data.timings.receive =
        timingEntry.responseEnd - timingEntry.responseStart;
    } else {
      data.timings.wait = totalTime;
    }

    // Calculate header sizes.
    const reqHeadersSize = calculateHeadersSize(data.request.headers);
    const resHeadersSize = data.response
      ? calculateHeadersSize(data.response.headers)
      : -1;

    // Determine HTTP version using a heuristic.
    let httpVersion = "HTTP/1.1";
    if (
      data.response &&
      data.response.headers.some(
        (header) => header.name.toLowerCase() === "x-firefox-spdy"
      )
    ) {
      httpVersion = "HTTP/2";
    }

    // Assemble the HAR entry.
    const harEntry = {
      startedDateTime: data.startedDateTime,
      time: totalTime,
      request: {
        method: data.request.method,
        url: data.request.url,
        httpVersion: httpVersion,
        cookies: data.request.cookies,
        headers: data.request.headers,
        queryString: getQueryParams(data.request.url),
        headersSize: reqHeadersSize,
        bodySize: data.request.postData ? data.request.postData.length : -1,
        postData: data.request.postData
          ? {
              mimeType: "application/octet-stream",
              text: data.request.postData,
            }
          : undefined,
      },
      response: data.response
        ? {
            status: data.response.status,
            statusText: data.response.statusText,
            httpVersion: httpVersion,
            cookies: data.response.cookies,
            headers: data.response.headers,
            content: {
              size: (() => {
                const clHeader = data.response.headers.find(
                  (h) => h.name.toLowerCase() === "content-length"
                );
                return clHeader ? parseInt(clHeader.value, 10) : -1;
              })(),
              mimeType: (() => {
                const ctHeader = data.response.headers.find(
                  (h) => h.name.toLowerCase() === "content-type"
                );
                return ctHeader ? ctHeader.value : "";
              })(),
              text: "", // Full response body is not available.
            },
            redirectURL: "",
            headersSize: resHeadersSize,
            bodySize: -1,
          }
        : {},
      cache: {},
      timings: data.timings,
      serverIPAddress: details.ip || "",
      connection: details.connectionId ? details.connectionId.toString() : "",
      pageref: "page_1",
    };

    // Add entry to HAR log.
    harLog.log.entries.push(harEntry);
    delete requestStore[details.requestId];

    // console.log("HAR Entry added:", harEntry);
    // console.log("Updated HAR Log:", harLog);
  },
  { urls: ["<all_urls>"] }
);

// onErrorOccurred: Cleanup on errors.
browser.webRequest.onErrorOccurred.addListener(
  (details) => {
    console.error("Request error:", details);
    delete requestStore[details.requestId];
  },
  { urls: ["<all_urls>"] }
);

/* ----- Messaging ----- */

// Listen for messages to either update page info or get the final HAR log.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_HAR") {
      // Return the HAR data.
      sendResponse({ type: "GET_HAR", har: getFinalHAR() });
    } else if (message.type === "UPDATE_PAGE") {
      // Update page section and return updated data.
      const updatedPage = updatePageSection(message.pageId, message.options);
      sendResponse({ page: updatedPage });
    } else if (message.type === "exportHar") {
      // Same as GET_HAR—return the final HAR log.
      sendResponse({ har: getFinalHAR() });
    }
  });
  
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();
    let data = [];
    filter.ondata = (event) => {
      data.push(event.data);
      filter.write(event.data);
    };
    filter.onstop = (event) => {
      let str = "";
      for (let chunk of data) {
        str += decoder.decode(chunk, { stream: true });
      }
      str += decoder.decode(); // flush
      // console.log("Captured response body:", str);
      filter.disconnect();
    };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
