export class EventHandler extends EventTarget {
  private listeners: { type: string, listener: EventListener | EventListenerObject | null }[] = [];

  emit(event: string, payload?: any) {
    this.dispatchEvent(new CustomEvent(event, { detail: payload }));
  }

  addEventListener(type: string, listener: EventListener | EventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
    this.listeners.push({ type, listener });
    return super.addEventListener(type, listener, options);
  }

  removeAllListeners() {
    for (let listener of this.listeners) {
      this.removeEventListener(listener.type, listener.listener);
    }
    this.listeners = [];
  }
}
