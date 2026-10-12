"""Prepare a bounded, attributed geographic scene from retained public sources."""
from pathlib import Path
import hashlib
import json
import math
import random
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data/vancouver-scene"
OUTPUT = ROOT / "public/data/vancouver" if (ROOT / "app").exists() else ROOT / "apps/coral-research-lab-open-source/public/data/vancouver"
ORIGIN = (-123.148, 49.292)

# Optional refresh; source snapshots stay in a named, ignored project directory.
if "--download" in __import__("sys").argv:
    from urllib.request import Request, urlopen
    from urllib.parse import urlencode
    SOURCE.mkdir(parents=True, exist_ok=True)
    for name, bbox in [("west-end", "-123.151,49.276,-123.130,49.292"), ("stanley-park", "-123.171,49.292,-123.129,49.317")]:
        url = "https://api.openstreetmap.org/api/0.6/map?bbox=" + bbox
        with urlopen(Request(url, headers={"User-Agent": "CORAL-Lab geographic renderer"}), timeout=40) as response:
            (SOURCE / (name + ".osm")).write_bytes(response.read())
    for start in [0, 1000, 2000, 3000]:
        url = "https://opendata.vancouver.ca/api/records/1.0/search/?" + urlencode({"dataset": "building-footprints-2009", "rows": 1000, "start": start, "geofilter.bbox": "49.274,-123.176,49.318,-123.122"})
        with urlopen(url, timeout=30) as response:
            (SOURCE / ("city-building-footprints-" + str(start) + ".json")).write_bytes(response.read())



def project(point):
    lon, lat = point
    return [round((lon - ORIGIN[0]) * 111320 * math.cos(math.radians(ORIGIN[1])), 2),
            round((ORIGIN[1] - lat) * 111320, 2)]


def inside(point, ring):
    x, y = point
    result = False
    for i, a in enumerate(ring):
        b = ring[i - 1]
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            result = not result
    return result


def join_coastlines(paths):
    paths = [path[:] for path in paths]
    while True:
        joined = False
        for i, a in enumerate(paths):
            for j in range(i + 1, len(paths)):
                b = paths[j]
                variants = [(a, b), (a, b[::-1]), (a[::-1], b), (a[::-1], b[::-1])]
                first, second = min(variants, key=lambda pair: math.dist(pair[0][-1], pair[1][0]))
                if math.dist(first[-1], second[0]) < 28:
                    paths[i] = first + second[1:]
                    paths.pop(j)
                    joined = True
                    break
            if joined:
                break
        if not joined:
            return paths


nodes, ways = {}, {}
for source in SOURCE.glob("*.osm"):
    xml = ET.parse(source).getroot()
    for node in xml.findall("node"):
        nodes[node.attrib["id"]] = {
            "point": project([float(node.attrib["lon"]), float(node.attrib["lat"])]),
            "tags": {tag.attrib["k"]: tag.attrib["v"] for tag in node.findall("tag")},
        }
    for way in xml.findall("way"):
        ways[way.attrib["id"]] = {
            "refs": [node.attrib["ref"] for node in way.findall("nd")],
            "tags": {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")},
        }


def points(way):
    return [nodes[ref]["point"] for ref in way["refs"] if ref in nodes]


coast = join_coastlines([points(way) for way in ways.values()
                        if way["tags"].get("natural") == "coastline"
                        and way["refs"][0] != way["refs"][-1]])
main_coast = max(coast, key=len)
land = main_coast + [[2600, main_coast[-1][1]], [2600, main_coast[0][1]], main_coast[0]]
park = [points(way) for way in ways.values()
        if way["tags"].get("leisure") == "park" and way["tags"].get("name") == "Stanley Park"][0]
lakes = [{"name": way["tags"].get("name", "Water"), "ring": points(way)} for way in ways.values()
         if way["tags"].get("natural") == "water" and way["tags"].get("name") in ["Lost Lagoon", "Beaver Lake"]]
city = []
for path in SOURCE.glob("city-building-footprints*.json"):
    for record in json.loads(path.read_text()).get("records", []):
        fields = record["fields"]
        point = fields.get("geo_point_2d")
        if point and fields.get("hgt_agl"):
            city.append({"point": project([point[1], point[0]]), "height": fields["hgt_agl"],
                         "base": fields.get("baseelev_m", 4)})
buildings = []
for identifier, way in ways.items():
    if "building" not in way["tags"] or len(way["refs"]) < 4:
        continue
    ring = points(way)
    if len(ring) < 4:
        continue
    center = [sum(p[i] for p in ring[:-1]) / (len(ring)-1) for i in [0, 1]]
    if not inside(center, land):
        continue
    tags = way["tags"]
    try:
        height = float(tags.get("height", "").split(" ")[0])
        basis = "OSM height"
    except ValueError:
        try:
            height = float(tags.get("building:levels", "")) * 3.1
            basis = "OSM storeys estimate"
        except ValueError:
            nearest = min(city, key=lambda row: math.dist(center, row["point"])) if city else None
            if nearest and math.dist(center, nearest["point"]) < 22:
                height, basis = nearest["height"], "City 2009 LiDAR"
            else:
                height, basis = (18 if tags.get("building") == "apartments" else 9), "estimated"
    buildings.append({"id": identifier, "ring": ring, "height": round(max(3, min(220, height)), 1), "basis": basis})
road_names = ["Beach Avenue", "Stanley Park Drive", "Denman Street", "Davie Street", "Burrard Street", "Robson Street"]
roads = [{"name": way["tags"]["name"], "points": points(way)} for way in ways.values()
         if "highway" in way["tags"] and way["tags"].get("name") in road_names]
rng = random.Random(142)
forest = []
for _ in range(34000):
    point = [rng.uniform(min(p[0] for p in park), max(p[0] for p in park)),
             rng.uniform(min(p[1] for p in park), max(p[1] for p in park))]
    if inside(point, park) and not any(inside(point, lake["ring"]) for lake in lakes):
        forest.append([round(point[0], 1), round(point[1], 1), round(rng.uniform(12, 30), 1)])
data = {"origin": ORIGIN, "land": land, "coastline": main_coast, "park": park, "lakes": lakes,
        "buildings": buildings, "roads": roads, "forest": forest,
        "description": "Georeferenced footprints and shoreline. Stylized terrain/canopy heights; simulated vessel motion."}
OUTPUT.mkdir(parents=True, exist_ok=True)
(OUTPUT / "scene.json").write_text(json.dumps(data, separators=(",", ":")))
manifest = {"sources": [], "license": "ODbL-1.0 for OSM-derived geometry; Open Government Licence - Vancouver for City attributes",
            "limitations": ["City height attributes describe 2009 conditions.", "Unspecified heights, terrain and canopy are stylized estimates.",
                            "The cropped land polygon closes beyond the view boundary; adjacent coast segments within 28m may be joined.",
                            "Vessels are a simulation, not live AIS or agent telemetry."],
            "counts": {"buildings": len(buildings), "coastline_vertices": len(main_coast), "forest_points": len(forest), "road_segments": len(roads)},
            "geometry_sha256": hashlib.sha256((OUTPUT / "scene.json").read_bytes()).hexdigest()}
for path in sorted(SOURCE.glob("*.osm")):
    manifest["sources"].append({"source": "OpenStreetMap", "snapshot": path.name,
                                "url": "https://api.openstreetmap.org/api/0.6/map", "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
manifest["sources"].append({"source": "City of Vancouver building footprints 2009",
                            "url": "https://opendata.vancouver.ca/explore/dataset/building-footprints-2009/"})
(OUTPUT / "source-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest["counts"], indent=2))
