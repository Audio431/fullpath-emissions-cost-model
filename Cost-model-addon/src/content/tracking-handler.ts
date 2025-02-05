export class ContentTrackingHandler {
    private clickHandler: ((e: Event) => void) | null = null;
    private scrollHandler: ((e: Event) => void) | null = null;
    private action: { type: string; payload: number }[] = [];
  
    async enableTracking(): Promise<void> {
      this.clickHandler = (e: Event) => {
        e.stopPropagation();
        browser.runtime.sendMessage({ type: "CLICK_EVENT", payload: (e.target as HTMLElement).tagName })
        .then((response) => {console.log("Response from background script:", response);})
        .catch((error) => {console.error("Error:", error);});
      };
  
      this.scrollHandler = (e: Event) => {
        e.stopPropagation();
        browser.runtime.sendMessage({ type: "SCROLL_EVENT", payload: window.scrollY })
        .then((response) => {console.log("Response from background script:", response);})
        .catch((error) => {console.error("Error:", error);});
        this.action.push({ type: "SCROLL_EVENT", payload: window.scrollY });
      };
  
      window.addEventListener("click", this.clickHandler, true);
      window.addEventListener("scroll", this.scrollHandler, { passive: true });
    }
  
    async disableTracking(): Promise<void> {
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
  