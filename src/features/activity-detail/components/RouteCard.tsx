import { Card, CardHeader } from "@/components";

import { RouteMap } from "./RouteMap";

export function RouteCard({ lat, lng }: { lat: (number | null)[]; lng: (number | null)[] }) {
  return (
    <Card label="Route">
      <CardHeader title="Route" subtitle="GPS track, north up" />
      <RouteMap lat={lat} lng={lng} />
    </Card>
  );
}
