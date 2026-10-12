export type Point = [number, number];
export type VancouverGeometry = {
  origin: Point;
  land: Point[];
  coastline: Point[];
  park: Point[];
  lakes: { name: string; ring: Point[] }[];
  buildings: { id: string; ring: Point[]; height: number; basis: string }[];
  roads: { name: string; points: Point[] }[];
  forest: [number, number, number][];
};
export type SceneState = { selected: string; terrain: boolean; tracks: boolean; connections: boolean; paused: boolean };
export type SceneCallbacks = {
  project: (id: string, x: number, y: number, visible: boolean) => void;
  select: (id: string) => void;
  status: (heading: number, fps: number, seconds: number, mode: "webgl" | "canvas", vesselHeading: number) => void;
};
export type SceneHandle = {
  setState: (state: SceneState) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  dispose: () => void;
};
export const geographicLabels = [
  { id: "stanley", text: "STANLEY PARK", point: [-420, 140, -1370] },
  { id: "beach", text: "BEACH AVENUE", point: [550, 55, 720] },
  { id: "bay", text: "ENGLISH BAY", point: [-1250, 8, 500] },
  { id: "sunset", text: "SUNSET BEACH", point: [710, 25, 1500] },
] as const;
