let isTracking = false;
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleTracking");
const testBtn = document.getElementById("testButton");

toggleBtn.addEventListener("click", async () => {
  isTracking = !isTracking;
  statusEl.textContent = `Tracking is ${isTracking ? 'ON' : 'OFF'}`;
  toggleBtn.textContent = isTracking ? 'Stop Tracking' : 'Start Tracking';

  // Inform the content script(s) about the new state, using runtime messaging
  // so they know to start or stop capturing events.
  // Send toggle message to background script
  browser.runtime.sendMessage({
    type: "TOGGLE_TRACKING"
  });
});


testBtn.addEventListener("click", () => {
  // browser.myAPI.getData().then((data) => {
  //   console.log("Popup API Response:", data);
  //   localStorage.setItem("popupData", JSON.stringify(data,null, 2));
  //   console.log("Popup API Response:", localStorage.getItem("popupData"));
  //   browser.tabs.create({
  //     url: "/report.html"
  //   });

  //   createExportButton(data);
  // }).catch((error) => {
  //   console.error("Popup API Error:", error);
  // });

  // console.log("Popup API Response:", data);
  browser.myAPI.getCPUInfo().then((data) => {
    console.log("Popup API Response:", data);
  //   // localStorage.setItem("popupData", JSON.stringify(data,null, 2));
  //   // console.log("Popup API Response:", localStorage.getItem("popupData"));
  // }).catch((error) => {
  //   console.error("Popup API Error:", error);
  });

});

/* ================================= */
// Function to create export button with direct data
function createExportButton(data) {
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export Data";
  exportButton.addEventListener("click", () => exportData(data));
  document.body.appendChild(exportButton);
}

// Function to export data
function exportData(data) {
  try {
    // Create blob with the stringified data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    
    // Get current timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadLink.download = `data-export-${timestamp}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Cleanup
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data:", error);
  }
}