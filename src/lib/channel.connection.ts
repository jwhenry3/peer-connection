import { EventHandler } from "./event-handler";
import { v4 as uuid }   from "uuid";

/**
 * Use this class when you want generic communication with other browser tabs
 * for the same domain
 */
export class ChannelConnection {
  instanceId: string;
  channel: BroadcastChannel;
  connected = false;
  events    = new EventHandler();
  peers     = [];

  onlineInterval                            = null;
  peerTimeouts: { [instance: string]: any } = {};

  constructor(public channelName: string, instanceId?: string) {
    this.channel    = new BroadcastChannel(channelName);
    this.instanceId = instanceId || uuid();
  }

  start() {
    this.onlineInterval    = setInterval(() => {
      this.emit("discovery", "online", this.instanceId);
    }, 1000);
    this.channel.onmessage = (message) => {
      if (typeof message.data !== "object") {
        return;
      }
      if ("event" in message.data) {
        if (message.data.event === "discovery.online" && message.data.instance) {
          this.handleOnlineEvent(message);
          return;
        }
        // If a target is specified, make sure it is this one
        if (!message.data.target || message.data.target === this.instanceId) {
          this.events.emit(message.data.event, message.data.payload);
        }
      }
    };
  }

  private handleOnlineEvent(message: MessageEvent<any>) {
    if (!this.peers.includes(message.data.instance)) {
      this.peers.push(message.data.instance);
    }
    if (this.peerTimeouts[message.data.instance]) {
      clearTimeout(this.peerTimeouts[message.data.instance]);
    }
    this.peerTimeouts[message.data.instance] = setTimeout(() => {
      if (this.peers.includes(message.data.instance)) {
        this.peers.splice(this.peers.indexOf(message.data.instance), 1);
      }
    }, 2000);
  }

  stop() {
    if (this.onlineInterval) {
      // Clear the message handler so we stop effectively listening
      this.channel.onmessage = () => {
      };
      this.peerTimeouts      = {};
      this.peers             = [];
      clearInterval(this.onlineInterval);
      this.onlineInterval = null;
    }
  }

  emit(channel: string, event: string, payload?: any) {
    this.channel.postMessage({
      event   : channel + "." + event,
      instance: this.instanceId,
      payload
    });
  }

  /**
   * Provide a specific peer instance to target and request data specifically
   * from that instance, otherwise if multiple instances are present, you may
   * get undesired results
   */
  request(channel: string, event: string, payload?: any, timeout = 10 * 1000, instance?: string) {
    return new Promise((resolve, reject) => {
      let id     = uuid();
      let handle = setTimeout(() => {
        reject("Timeout");
        this.off(channel, event + ".response", cb);
      }, timeout);
      let cb     = (event: CustomEvent) => {
        if (event.detail.id === id) {
          resolve(event.detail.data);
          this.off(channel, event + ".response", cb);
          clearTimeout(handle);
        }
      };
      this.on(channel, event + ".response", cb);
      this.emit(channel, event + ".request", {
        id,
        data  : payload,
        target: instance
      });
    });
  }

  respond(channel: string, event: string, id: string, payload?: any) {
    this.emit(channel, event + ".response", { id, data: payload });
  }

  onRequest(channel: string, event: string, cb: (event: CustomEvent) => void) {
    this.on(channel, event + ".request", cb);
  }

  on(channel: string, event: string, cb: (event: CustomEvent) => void) {
    this.events.addEventListener(channel + "." + event, cb as (event: Event) => void);
  }

  off(channel: string, event: string, cb: (event: CustomEvent) => void) {
    this.events.removeEventListener(channel + "." + event, cb as (event: Event) => void);
  }


  ping() {
    let id = uuid();
    this.request("connection", "ping", { id }, 500)
        .then(() => {
          if (!this.connected) {
            this.events.emit("connection.online", {});
          }
          this.connected = true;
        }).catch(() => {
      if (this.connected) {
        this.connected = false;
        this.events.emit("connection.offline", {});
      }
    });
  }
}
