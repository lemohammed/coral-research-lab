import type { VancouverGeometry } from "./types";

export type Projected = { x: number; y: number; depth: number; scale: number };
export type Projector = (x: number, y: number, z: number) => Projected | null;
type Vertex = [number, number, number];
export function polygon(context: CanvasRenderingContext2D, vertices: Vertex[], project: Projector, fill: string, stroke?: string) {
  const points = vertices.map(([x, y, z]) => project(x, y, z));
  if (points.some((point) => !point)) return;
  context.beginPath(); points.forEach((point, i) => { if (point) { if (!i) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y); } }); context.closePath();
  context.fillStyle = fill; context.fill();
  if (stroke) { context.strokeStyle = stroke; context.lineWidth = .45; context.stroke(); }
}
export function paintGeography(context: CanvasRenderingContext2D, data: VancouverGeometry, project: Projector, width: number, height: number) {
  context.clearRect(0, 0, width, height); context.beginPath();
  for (const ring of [data.land, ...data.lakes.map((lake) => lake.ring)]) {
    const points = ring.map(([x, z]) => project(x, 4, z)).filter((point): point is Projected => !!point);
    points.forEach((point, i) => i ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.closePath();
  }
  context.fillStyle = "#e9ece9"; context.fill("evenodd"); context.strokeStyle = "#f6f7f2"; context.lineWidth = 1.8; context.stroke();
  const buildings = data.buildings.map((building) => {
    const center = building.ring.reduce((point, p) => [point[0] + p[0] / building.ring.length, point[1] + p[1] / building.ring.length], [0, 0]);
    return { ...building, center: project(center[0], building.height / 2 + 5, center[1]) };
  }).filter((building) => building.center && building.center.x > -250 && building.center.x < width + 250 && building.center.y > -250 && building.center.y < height + 250).sort((a, b) => (b.center?.depth ?? 0) - (a.center?.depth ?? 0));
  for (const building of buildings) {
    polygon(context, building.ring.map(([x, z]): Vertex => [x + building.height * .22, 4.2, z + building.height * .15]), project, "#a7b3b31c");
  }
  for (const building of buildings) {
    const top = building.height + 5;
    for (let i = 1; i < building.ring.length; i++) {
      const a = building.ring[i - 1], b = building.ring[i];
      const light = ((b[0] - a[0]) - (b[1] - a[1])) / Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]));
      const shade = Math.round(221 + light * 13);
      polygon(context, [[a[0], 5, a[1]], [b[0], 5, b[1]], [b[0], top, b[1]], [a[0], top, a[1]]], project, `rgb(${shade},${shade + 3},${shade + 2})`);
      context.strokeStyle = "#89959645"; context.lineWidth = .4; context.beginPath();
      for (let y = 10; y < top; y += 6) {
        const p = project(a[0], y, a[1]), q = project(b[0], y, b[1]);
        if (p && q) { context.moveTo(p.x, p.y); context.lineTo(q.x, q.y); }
      }
      context.stroke();
    }
    polygon(context, building.ring.map(([x, z]): Vertex => [x, top, z]), project, "#f8f9f5", "#adb8b855");
  }
  for (const road of data.roads) {
    context.beginPath(); context.strokeStyle = road.name === "Beach Avenue" ? "#a9aaa099" : "#a4b0b16b"; context.lineWidth = road.name === "Beach Avenue" ? 1.3 : .6;
    road.points.forEach(([x, z], i) => { const p = project(x, 5, z); if (p) { if (i) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y); } }); context.stroke();
  }
  const canopy = data.forest.map(([x, z, y]) => project(x, y + 4 + 39 * Math.exp(-((x + 300) ** 2 / 650 ** 2 + (z + 1400) ** 2 / 1000 ** 2)), z)).filter((p): p is Projected => !!p && p.x > -20 && p.x < width + 20 && p.y > -20 && p.y < height + 20).sort((a, b) => b.depth - a.depth);
  for (const point of canopy) {
    const r = Math.max(.5, Math.min(5.5, point.scale * 4));
    context.fillStyle = "#91a1a0"; context.beginPath(); context.arc(point.x, point.y, r, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#f4f6f1"; context.beginPath(); context.arc(point.x - r * .14, point.y - r * .2, r * .78, 0, Math.PI * 2); context.fill();
  }
}
export function paintShip(context: CanvasRenderingContext2D, project: Projector, x: number, z: number, angle: number, length: number) {
  const scale = length / 155, sin = Math.sin(angle), cos = Math.cos(angle);
  function vertex(a: number, y: number, b: number): Vertex { return [x + (a * cos + b * sin) * scale, y * scale, z + (-a * sin + b * cos) * scale]; }
  const hull = [[-13, 60], [13, 60], [14, -43], [9, -66], [0, -78], [-9, -66], [-14, -43]];
  polygon(context, hull.map(([a, b]) => vertex(a + 5, 0, b + 5)), project, "#88999a44");
  for (let i = 0; i < hull.length; i++) { const a = hull[i], b = hull[(i + 1) % hull.length]; polygon(context, [vertex(a[0], 1, a[1]), vertex(b[0], 1, b[1]), vertex(b[0], 10, b[1]), vertex(a[0], 10, a[1])], project, "#c7d0cf"); }
  polygon(context, hull.map(([a, b]) => vertex(a, 10, b)), project, "#f5f7f3", "#afbab9");
  function box(a: number, y: number, b: number, w: number, h: number, d: number, fill = "#edf1ec") {
    for (const edge of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      const p = edge[0], q = edge[1]; polygon(context, [vertex(a + p[0] * w / 2, y, b + p[1] * d / 2), vertex(a + q[0] * w / 2, y, b + q[1] * d / 2), vertex(a + q[0] * w / 2, y + h, b + q[1] * d / 2), vertex(a + p[0] * w / 2, y + h, b + p[1] * d / 2)], project, "#c2cdcc");
    }
    polygon(context, [vertex(a-w/2,y+h,b-d/2),vertex(a+w/2,y+h,b-d/2),vertex(a+w/2,y+h,b+d/2),vertex(a-w/2,y+h,b+d/2)], project, fill, "#a3b0b2");
  }
  for (let row = 0; row < 6; row++) for (const a of [-6, 6]) box(a, 10, -43 + row * 13, 10, 6, 11, row % 3 ? "#f0f4ee" : "#b4c2c2");
  box(0, 10, 46, 23, 12, 19); box(0, 22, 49, 19, 5, 15); box(0, 27, 50, 17, 4, 10);
}
