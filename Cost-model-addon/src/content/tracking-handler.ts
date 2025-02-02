export class ContentTrackingHandler {
    private clickHandler: ((e: Event) => void) | null = null;
    private scrollHandler: ((e: Event) => void) | null = null;
  
    enableTracking(): void {
      this.clickHandler = (e: Event) => {
        console.log("[Content Script] Click event:", e);
        browser.runtime.sendMessage({ type: "CLICK_EVENT", payload: e });
      };
  
      this.scrollHandler = (e: Event) => {
        console.log("[Content Script] Scroll event:", window.scrollY);
        browser.runtime.sendMessage({ type: "SCROLL_EVENT", payload: window.scrollY });
      };
  
      window.addEventListener("click", this.clickHandler, true);
      window.addEventListener("scroll", this.scrollHandler, { passive: true });
    }
  
    disableTracking(): void {
      if (this.clickHandler) {
        window.removeEventListener("click", this.clickHandler, true);
        this.clickHandler = null;
      }
      if (this.scrollHandler) {
        window.removeEventListener("scroll", this.scrollHandler);
        this.scrollHandler = null;
      }
    }
}
  