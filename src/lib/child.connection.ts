import { ChannelConnection } from "./channel.connection";

/**
 * Use this class when needing to connect to a parent instance
 * This way your connection is guaranteed and you can exchange data
 * in a controlled manner.
 */
export class ChildConnection extends ChannelConnection {
  connected = false;

  interval = null;

  start() {
    super.start();
    this.ping();
    // Rapid fire ping until connected so we don't have any lapse at start
    let interval  = setInterval(() => {
      if (!this.connected) {
        this.ping();
      } else {
        clearInterval(interval);
      }
    }, 500);
    this.interval = setInterval(() => {
      this.ping();
    }, 5000);
  }

  stop() {
    super.stop();
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
