export class ContentTrackingHandler {
  private clickHandler: ((e: Event) => void) | null = null;
  private scrollHandler: ((e: Event) => void) | null = null;
  private action: { type: string; payload: number }[] = [];
  private port: browser.runtime.Port | null = null;

  registerPort(port: browser.runtime.Port): void {
    this.port = port;
    this.port.onDisconnect.addListener(() => {
      this.port = null;
    });
  }

  unregisterPort(): void {
    this.port = null;
  }
    
  async enableTracking(): Promise<void> {

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
