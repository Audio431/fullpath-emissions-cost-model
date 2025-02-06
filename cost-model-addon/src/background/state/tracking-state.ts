import { EventEmitter } from 'events';

export class TrackingState {
  private static instance: TrackingState;
  private eventEmitter: EventEmitter;
  private isActive: boolean = false;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): TrackingState {
    if (!TrackingState.instance) {
      TrackingState.instance = new TrackingState();
    }
    return TrackingState.instance;
  }

  public startTracking(): void {
    if (!this.isActive) {
      this.isActive = true;
      this.eventEmitter.emit('TrackingStateChanged', true);
    }
  }

  public stopTracking(): void {
    if (this.isActive) {
      this.isActive = false;
      this.eventEmitter.emit('TrackingStateChanged', false);
    }
  }

  public isTrackingActive(): boolean {
    return this.isActive;
  }

  public onStateChange(callback: (state: boolean) => void): void {
    this.eventEmitter.on('TrackingStateChanged', callback);
  }
}