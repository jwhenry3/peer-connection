import { ChannelConnection } from "./channel.connection";

/**
 * This should be a single instance that becomes responsible for behaviors
 * that should only run on one instance,
 * ex: Ongoing Connections (WebSocket, SSE, etc)
 */
export class ParentConnection extends ChannelConnection {

  onPing = (event: CustomEvent) => {
    this.respond("connection", "ping", event.detail.id, {});
  };

  start() {
    super.start();
    this.on("connection", "ping.request", this.onPing);
  }

  stop() {
    super.stop();
    this.off("connection", "ping.request", this.onPing);
  }
}
