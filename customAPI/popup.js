document.getElementById("testButton").addEventListener("click", () => {
    customAPI.getData().then((data) => {
      console.log("Popup API Response:", data);
    }).catch((error) => {
      console.error("Popup API Error:", error);
    });
  });
  