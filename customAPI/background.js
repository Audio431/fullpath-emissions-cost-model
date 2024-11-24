browser.myAPI.getData().then((path) => {
    console.log("Profile Directory Path:", path);
  }).catch((error) => {
    console.error("Error:", error);
  });
  