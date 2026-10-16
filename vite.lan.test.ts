import { isLocalAddress } from "./vite.lan";

describe("local network check (dev and preview servers)", () => {
  it("allows loopback, private and link-local peers", () => {
    for (const a of ["127.0.0.1", "::1", "192.168.1.5", "10.2.3.4", "172.31.0.1", "fd9b::1", "fe80::1%eth0", "::ffff:192.168.1.5"]) {
      expect(isLocalAddress(a)).toBe(true);
    }
  });

  it("refuses everyone else", () => {
    for (const a of ["8.8.8.8", "172.32.0.1", "100.64.0.1", "2001:db8::1", "::ffff:8.8.8.8", "", undefined, "nonsense"]) {
      expect(isLocalAddress(a)).toBe(false);
    }
  });
});
