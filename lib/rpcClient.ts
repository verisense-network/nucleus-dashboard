import { ENDPOINT } from "@/config/endpoint";
import { RequestManager, Client, HTTPTransport, WebSocketTransport } from "@open-rpc/client-js";

export async function getRpcClient(endpoint?: string) {
  const isHttpEndpoint = endpoint?.startsWith("http");
  const url = endpoint || ENDPOINT;
  let client: Client;

  if (isHttpEndpoint) {
    const transport = new HTTPTransport(url);
    const requestManager = new RequestManager([transport]);
    client = new Client(requestManager);
  } else {
    const transport = new WebSocketTransport(url);
    const requestManager = new RequestManager([transport]);
    client = new Client(requestManager);
  }
  return client;
}
