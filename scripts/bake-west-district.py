"""Bake public OSM geometry offline. Usage: python bake-west-district.py map.osm (Shapely 2).
Extract bbox: 126.9655,37.5625,126.9765,37.5735. Coordinates match public/layout.js in metres.
"""
import json
import math
from shapely.ops import triangulate
from shapely.geometry import MultiPoint
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

root = ET.parse(sys.argv[1]).getroot()
nodes = {n.get("id"): (round((float(n.get("lon"))-126.97150)*88263, 2),
                       round((37.56780-float(n.get("lat")))*111000, 2)) for n in root.findall("node")}
ways = {}
for way in root.findall("way"):
    pts = [nodes[n.get("ref")] for n in way.findall("nd") if n.get("ref") in nodes]
    if len(pts) > 1:
        ways[int(way.get("id"))] = ({t.get("k"):t.get("v") for t in way.findall("tag")}, pts)

def line(i):
    return LineString(ways[i][1])
def poly(i):
    return Polygon(ways[i][1]).buffer(0)
def rings(p):
    def coords(r):
        return [[round(x,2),round(y,2)] for x,y in list(r.coords)[:-1]]
    return [coords(p.exterior), *(coords(h) for h in p.interiors)]
def parts(geom):
    if geom.is_empty: return []
    if geom.geom_type == "Polygon": return [geom] if geom.area > .08 else []
    return [p for g in getattr(geom,"geoms",[]) for p in parts(g)]

palace = poly(768471592)
museum = line(183272668).buffer(13).union(poly(777427337).buffer(10)).union(poly(626112515).buffer(6))
jeongdong = line(183272433)
avenue = unary_union([line(i) for i in [621513149,773066533,621513153,621513157,184083158,919985574]])
# The carriageways taper and the median narrows toward Gwanghwamun.
avenue = avenue.intersection(box(-238,-300,339,0))
area = unary_union([museum, palace, jeongdong.buffer(21),avenue.buffer(17),line(238543311).buffer(7),
                    line(238542338).buffer(9),line(238541245).buffer(12),poly(768444911),line(78503341).buffer(8)])
kinds = {k:[] for k in ["crossing","stone","path","street","road","grass","grove"]}
kinds["grove"] += [palace,museum]
kinds["verge"] = [jeongdong.buffer(16).difference(box(120,0,500,307))]
kinds["road"].append(avenue.buffer(6.0))
kinds["path"].append(avenue.buffer(11.5).difference(avenue.buffer(6)))
kinds["street"].append(jeongdong.buffer(5.4))
kinds["path"].append(jeongdong.buffer(8.6))
# Continue beside the existing Sejong-daero intersection, sharing its two curb lines.
kinds["path"] += [Polygon([(328,-285),(338,-288),(449,-288),(453,-290),(453,-296),(338,-294),(328,-286)]),
                  Polygon([(327,-251),(338,-252),(421,-252),(472,-250),(472,-243),(421,-246),(338,-246),(327,-244)])]
area = area.union(unary_union(kinds["path"][-2:]))
crossings = []
# Where the mapped approach meets the older Deoksugung fountain surface.
kinds["path"].append(LineString([(164,286),(174.02,294.7)]).buffer(3))
kinds["path"].append(line(238543311).buffer(3.2))
# Courtyard surfaces bounded by the mapped gate and the two flank galleries.
kinds["stone"].append(Polygon([(-302,-337),(-242,-374),(-286,-441),(-349,-404)]))
# Open lawn approach around the planted beds in front of Sungjeongmun.
kinds["path"].append(Polygon([(-280,-350),(-221,-387),(-169,-301),(-240,-251),(-311,-321)]))
kinds["path"].append(LineString([(-165,-191),(-181,-220),(-183,-247),(-207,-247),(-236,-271)]).buffer(3))
# Museum entrance and exterior court.
kinds["path"].append(line(183272668).buffer(3.1))
kinds["stone"].append(poly(777427337))
palace_parts = {196072048,196072051,196072053,196072054,196072056,555488612,555488613}
gates = {196071778,196072046,196072055,555488600}
halls = {196072049,196072052,555488614}
context = area.buffer(25)
buildings = []
for i,(t,pts) in ways.items():
    ln = LineString(pts)
    if not context.intersects(ln): continue
    closed = pts[0] == pts[-1] and len(pts)>3
    pg = Polygon(pts).buffer(0) if closed else None
    if closed and ("building" in t or i==607996709):
        if t.get("building")=="roof" or pg.area<12: continue
        if not context.covers(pg.representative_point()) and i!=607996709: continue
        if i==607996709: pg=pg.difference(poly(607996710))
        # Existing Deoksugung models meet the east end of Jeongdong-gil.
        if pg.centroid.x>60 and 0<pg.centroid.y<305 or pg.centroid.x>342 and pg.centroid.y<0: continue
        if pg.centroid.x>215 and pg.centroid.y>300 and i!=381941864: continue
        if i in gates: kind="gate"
        elif i in halls: kind="hall"
        elif i in palace_parts: kind="gallery"
        elif i==626112515: kind="sema"
        else: kind="block"
        h=float(t.get("height","0").split()[0]) if t.get("height","0").replace(".","").isdigit() else 0
        levels=t.get("building:levels","")
        for pp in parts(pg):
            buildings.append(dict(id=i, name=t.get("name","서울역사박물관" if i==607996709 else ""),kind=kind,
                     height=h or (float(levels)*3.4 if levels.isdigit() else 10.2), rings=rings(pp)))
            if kind=="gallery":
                samples=list(pp.exterior.coords)
                for inset in (1.4,2.6,3.35):
                    for island in parts(pp.buffer(-inset,join_style="mitre")):
                        samples+=list(island.exterior.coords)
                roof=[]
                for tri in triangulate(MultiPoint(samples)):
                    if pp.covers(tri.representative_point()) and tri.difference(pp).area<.05:
                        roof.append([[round(x,2),round(y,2),round(pp.boundary.distance(Point(x,y)),2)] for x,y in list(tri.exterior.coords)[:3]])
                buildings[-1]["roof"]=roof
        continue
    if not area.intersects(ln): continue
    if t.get("access") in ("private","no") or t.get("layer","0").startswith("-") or t.get("tunnel"):continue
    hw=t.get("highway")
    if closed and (t.get("area:highway") or t.get("area")=="yes" and hw):
        if t.get("area:highway") not in (None,"footway","pedestrian","steps"):continue
        kinds["stone"].append(pg.intersection(area))
    elif closed and t.get("landuse")=="grass":kinds["grass"].append(pg.intersection(area))
    elif hw in ("path","steps","footway","pedestrian","service","living_street","residential"):
        if i in (183272433,183272668):continue
        crossing=t.get("footway")=="crossing"
        key="crossing" if crossing else "path" if hw in ("footway","steps","path","pedestrian") else "street"
        if crossing:
            dx,dy=pts[-1][0]-pts[0][0],pts[-1][1]-pts[0][1]
            if dx or dy: crossings.append((ln,round(math.atan2(dy,dx),4)))
        width=4.2 if crossing else 5.5 if key=="street" else 2.4
        kinds[key].append(ln.buffer(width/2).intersection(area))
blocked=unary_union([Polygon(b["rings"][0],b["rings"][1:]) for b in buildings if b["kind"] in ("block","sema")])
# Bake disjoint surfaces so coplanar materials never fight. Choose surveyed turf before the approach apron.
surfaces=[]
used=blocked
# Finishes share polygon boundaries. The ceremonial lane occupies its own strip,
# so it never sits above a second set of coplanar courtyard stones.
court_axis = LineString([(-274.08,-352.58),(-303.45,-403.16)])
royal_lane = court_axis.buffer(2.0,cap_style="flat")
palace_angle = -.563
brick_walk = jeongdong.buffer(10)
def finish(p,kind):
    remaining = p
    treatments=[]
    if kind == "crossing" and crossings:
        _,angle=min(crossings,key=lambda entry:entry[0].distance(p.representative_point()))
        return [dict(kind=kind,rings=rings(p),angle=angle)]
    if kind in ("path","stone","street"):
        if kind=="stone": treatments.extend([(royal_lane,"royal",palace_angle),(palace,"court",palace_angle)])
        treatments += [(museum,"granite",.037),(palace,"gravel",palace_angle),
                       (brick_walk,"setts" if kind=="street" else "brickwalk",.72)]
    results=[]
    for zone,material,angle in treatments:
        if remaining.is_empty: break
        for q in parts(remaining.intersection(zone)):
            results.append(dict(kind=kind,finish=material,angle=angle,rings=rings(q)))
        remaining=remaining.difference(zone)
    return results+[dict(kind=kind,rings=rings(q)) for q in parts(remaining)]

for kind in ["crossing","stone","grass","road","street","path","grove","verge"]:
    geom=unary_union(kinds[kind]).difference(used).simplify(.09,preserve_topology=True)
    for p in parts(geom):
        surfaces.extend(finish(p,kind))
    used=used.union(geom)
out=Path(__file__).resolve().parents[1]/"public/west-district-data.js"
with out.open("w",encoding="utf-8") as f:
    f.write("// Geometry © OpenStreetMap contributors, ODbL 1.0. See scripts/bake-west-district.py.\n")
    for name,rows in [("westSurfaces",surfaces),("westBuildings",buildings)]:
        f.write("export const "+name+"=[\n"+",\n".join(json.dumps(r,ensure_ascii=False,separators=(",",":")) for r in rows)+"\n];\n")
    # Place street trees on the outer shoulder of the pavement, clear of doors and crossings.
    street_trees = []
    for offset in (-9.35,9.35):
        for dist in range(28, int(jeongdong.length)-8, 17):
            p=jeongdong.interpolate(dist)
            a,b=jeongdong.interpolate(dist-1),jeongdong.interpolate(dist+1)
            norm=math.hypot(b.x-a.x,b.y-a.y)
            x,y=p.x+(b.y-a.y)*offset/norm,p.y-(b.x-a.x)*offset/norm
            point=Point(x,y)
            if x<115 and blocked.distance(point)>2.8 and all(ln.distance(point)>3 for ln,_ in crossings):
                street_trees.append([round(x,2),round(y,2)])
    f.write("export const westStreetTrees="+json.dumps(street_trees,separators=(",",":"))+";\n")
print(len(buildings),"footprints,",len(surfaces),"ground polygons")
