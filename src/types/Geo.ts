export interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number] | [number, number, number];
}
