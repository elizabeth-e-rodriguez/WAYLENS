export class WsHudLink {
  private ws: WebSocket | null = null;

  connect(ip: string, port = 81) {
    const url = `ws://${ip}:${port}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => console.log("WS open:", url);
    this.ws.onclose = () => console.log("WS closed");
    this.ws.onerror = (e) => console.log("WS error:", e);
  }

  sendJson(obj: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }

  isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}