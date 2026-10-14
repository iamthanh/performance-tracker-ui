import { BlockList, isIPv6 } from "node:net";

import type { Connect, Plugin } from "vite";

// The local network: loopback, private (10/8, 172.16/12, 192.168/16, fc00::/7) and link-local.
// IPv4-mapped IPv6 peers ("::ffff:192.168.1.5") are matched against the IPv4 ranges.
const LOCAL = new BlockList();
for (const [net, prefix] of [["127.0.0.0", 8], ["10.0.0.0", 8], ["172.16.0.0", 12], ["192.168.0.0", 16], ["169.254.0.0", 16]] as const) {
  LOCAL.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [["::1", 128], ["fc00::", 7], ["fe80::", 10]] as const) LOCAL.addSubnet(net, prefix, "ipv6");

export function isLocalAddress(address: string | undefined): boolean {
  if (!address) return false;
  const ip = address.split("%")[0]!;
  try {
    return LOCAL.check(ip, isIPv6(ip) ? "ipv6" : "ipv4");
  } catch {
    return false; // not an IP address
  }
}

const localOnly: Connect.NextHandleFunction = (req, res, next) => {
  if (isLocalAddress(req.socket.remoteAddress)) return next();
  res.statusCode = 403;
  res.end("Only the local network is served.");
};

/**
 * With `--host 0.0.0.0` Vite listens on every interface, including a public IPv4 or IPv6 address if the machine
 * has one. Its proxy reaches the API from 127.0.0.1, so the API cannot tell who asked: refuse outsiders here.
 */
export function localNetworkOnly(): Plugin {
  return {
    name: "local-network-only",
    configureServer: (server) => void server.middlewares.use(localOnly),
    configurePreviewServer: (server) => void server.middlewares.use(localOnly),
  };
}
