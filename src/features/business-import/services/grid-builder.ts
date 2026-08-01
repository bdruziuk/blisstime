import type { GeoBounds, ImportArea } from "../domain/types";

export function isValidBounds(bounds: GeoBounds): boolean {
  return (
    Number.isFinite(bounds.south) &&
    Number.isFinite(bounds.west) &&
    Number.isFinite(bounds.north) &&
    Number.isFinite(bounds.east) &&
    bounds.south < bounds.north &&
    bounds.west < bounds.east
  );
}

export function containsCoordinates(bounds: GeoBounds, lat: number, lng: number): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export function splitArea(area: ImportArea): ImportArea[] {
  const midLat = (area.bounds.south + area.bounds.north) / 2;
  const midLng = (area.bounds.west + area.bounds.east) / 2;
  const depth = area.depth + 1;
  return [
    { bounds: { south: area.bounds.south, west: area.bounds.west, north: midLat, east: midLng }, depth },
    { bounds: { south: area.bounds.south, west: midLng, north: midLat, east: area.bounds.east }, depth },
    { bounds: { south: midLat, west: area.bounds.west, north: area.bounds.north, east: midLng }, depth },
    { bounds: { south: midLat, west: midLng, north: area.bounds.north, east: area.bounds.east }, depth },
  ];
}

export function buildGrid(bounds: GeoBounds, rows: number, columns: number): ImportArea[] {
  if (!isValidBounds(bounds)) throw new Error("Некоректні географічні межі міста");
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
    throw new Error("Розмір сітки має бути додатним цілим числом");
  }
  const latStep = (bounds.north - bounds.south) / rows;
  const lngStep = (bounds.east - bounds.west) / columns;
  const areas: ImportArea[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      areas.push({
        depth: 0,
        bounds: {
          south: bounds.south + row * latStep,
          north: row === rows - 1 ? bounds.north : bounds.south + (row + 1) * latStep,
          west: bounds.west + column * lngStep,
          east: column === columns - 1 ? bounds.east : bounds.west + (column + 1) * lngStep,
        },
      });
    }
  }
  return areas;
}

export function approximateCellSizeKm(bounds: GeoBounds): number {
  const latKm = (bounds.north - bounds.south) * 111.32;
  const centerLatRadians = ((bounds.north + bounds.south) / 2) * (Math.PI / 180);
  const lngKm = (bounds.east - bounds.west) * 111.32 * Math.cos(centerLatRadians);
  return Math.max(Math.abs(latKm), Math.abs(lngKm));
}
