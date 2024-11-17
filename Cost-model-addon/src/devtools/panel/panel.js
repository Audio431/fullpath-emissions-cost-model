const perf_button = document.getElementById("perf_button")

perf_button.addEventListener("click", async function() {
    await browser.runtime.sendMessage({data: "start testing performance"});
    
})
