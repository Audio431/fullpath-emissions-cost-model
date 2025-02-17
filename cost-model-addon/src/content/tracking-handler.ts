export class ContentTrackingHandler {
  private clickHandler: ((e: Event) => void) | null = null;
  private scrollHandler: ((e: Event) => void) | null = null;
  private action: { type: string; payload: number }[] = [];
  private port: browser.runtime.Port | null = null;
    
  async enableTracking(): Promise<void> {

    this.port = browser.runtime.connect({ name: "content-script" });

    if (!this.port) {
      console.error("Port is not connected. Cannot enable tracking.");
      return;
    }

    this.clickHandler = (e: Event) => {
      // e.stopPropagation();
      this.port!.postMessage({
        type: "CLICK_EVENT",
        payload: (e.target as HTMLElement).tagName,
      });
    };

    this.scrollHandler = (e: Event) => {
      // e.stopPropagation();
      this.port!.postMessage({
        type: "SCROLL_EVENT",
        payload: window.scrollY,
      });
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
    
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

}
