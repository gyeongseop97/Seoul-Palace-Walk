"""Bake the Seoul Station approach from an OSM /map XML extract (Shapely 2).
BBox 126.9680,37.5531,126.9788,37.56525. Coordinates are metres in layout.js.
The original geometry is © OpenStreetMap contributors, ODbL 1.0.
"""
import json
import math
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union
from shapely import set_precision

root = ET.parse(sys.argv[1]).getroot()
def tags(element):
    return {tag.get("k"): tag.get("v") for tag in element.findall("tag")}
nodes = {n.get("id"): (round((float(n.get("lon"))-126.97150)*88263,2),
                        round((37.56780-float(n.get("lat")))*111000,2)) for n in root.findall("node")}
ways = {int(w.get("id")): (tags(w), [nodes[n.get("ref")] for n in w.findall("nd")]) for w in root.findall("way")}
def line(i): return LineString(ways[i][1])
def poly(i): return Polygon(ways[i][1]).buffer(0)
def parts(shape):
    if shape.is_empty: return []
    if shape.geom_type=="Polygon": return [shape] if shape.area>.11 else []
    return [part for g in getattr(shape,"geoms",[]) for part in parts(g)]
def rings(shape):
    return [[[round(x,2),round(y,2)] for x,y in list(r.coords)[:-1]] for r in [shape.exterior,*shape.interiors]]
def merge(shapes):
    return unary_union([set_precision(p,.02) for p in shapes if not p.is_empty])
def dumped(value): return json.dumps(value,ensure_ascii=False,separators=(",",":"))

spine=LineString([(485,380),(476,425),(381,748),(347,805),(291,858),(249,947),(106,1189),(105,1340),(104,1537)])
scope=spine.buffer(66).union(box(-19,1201,206,1518)).intersection(box(-100,399,610,1530))
# Meet both existing mapped city-hall subway pavements at the southern kerb line.
joins=[LineString([(434,404),(443,409),(457,416),(459,427)]).buffer(3.2),
       LineString([(519,394),(511,403),(502,421),(496,435)]).buffer(3.6)]
scope=scope.union(merge(joins))
# Off-stage gallery and arcade floors occupy some outlying, non-corridor plots.
for bounds in [(309,437,393,547),(512,503.8,528,526.2),(472,569.8,488,592.2),(531,570,547,593)]:
    scope=scope.difference(box(*bounds))
context=scope.buffer(52)
busways=[];road_centres=[];public_squares=[];parks=[]
road=[];walk=list(joins);cross=[];crossing_lines=[];grass=[];buildings=[];built=[];squares=[];platforms=[];taxi_aprons=[];trees=[]
for i,(t,pts) in ways.items():
    if len(pts)<2 or i in (767663127,767663128):continue  # Masonry parts of the Sungnyemun gate relation.
    ln=LineString(pts)
    if not context.intersects(ln):continue
    closed=len(pts)>3 and pts[0]==pts[-1]
    pg=Polygon(pts).buffer(0) if closed else None
    if closed and t.get("building") and t["building"] not in ("roof","construction") and pg.area>14:
        if not context.covers(pg.representative_point()) or pg.centroid.y<406:continue
        if not pg.intersects(scope.buffer(34)):continue
        kind={759569673:"historic",216477743:"squareOffice"}.get(i,"block")
        h=t.get("height","").split(" ")[0];levels=t.get("building:levels","")
        height=float(h) if h.replace(".","",1).isdigit() else float(levels)*3.35 if levels.isdigit() else (12+min(16,int(pg.area/170)))
        for part in parts(pg.simplify(.14,preserve_topology=True)):
            buildings.append(dict(id=i,name=t.get("name",""),kind=kind,height=round(height,1),rings=rings(part)))
            built.append(part)
        continue
    if not scope.intersects(ln) and not (closed and pg.intersects(scope)):continue
    if t.get("layer","0").startswith("-") or t.get("tunnel") or t.get("bridge"):continue
    hw=t.get("highway")
    if hw=="busway" and (t.get("bus") in ("yes","designated","permissive") or t.get("access") not in ("no","private")):
        busways.append(ln.buffer(1.85));continue
    footway=hw in ("footway","pedestrian","steps","path","cycleway","platform")
    foot=t.get("foot")
    if t.get("access") in ("no","private") and not (footway and foot in ("yes","designated","permissive")):continue
    if footway and foot in ("no","private"):continue
    if closed and t.get("place")=="square":public_squares.append(pg)
    if closed and t.get("leisure")=="park":parks.append(pg)
    if closed and ((hw in ("pedestrian","footway") and t.get("area")=="yes") or t.get("area:highway") in ("footway","pedestrian")):
        squares.append(pg)
    elif hw=="platform" or t.get("public_transport")=="platform":
        platform = pg if closed else ln.buffer(2.15)
        platforms.append(platform)
        if t.get("taxi")=="yes":taxi_aprons.append(platform)
    elif hw in ("pedestrian","footway","steps","path","cycleway"):
        if t.get("footway")=="crossing":
            dx,dy=pts[-1][0]-pts[0][0],pts[-1][1]-pts[0][1]
            cross.append((ln.buffer(2.35,cap_style="square"),round(math.atan2(dy,dx),4)))
            crossing_lines.append([pts[0],pts[-1],4.7])
        else:walk.append(ln.buffer(2.25))
    elif hw in ("primary","trunk","secondary","tertiary","residential","service","living_street","unclassified","primary_link","secondary_link"):
        defaults={"primary":9.2,"trunk":10,"secondary":7,"tertiary":5.5,"service":2.8}
        lanes=t.get("lanes","")
        radius=min(10.6,float(lanes)*1.58) if lanes.isdigit() else defaults.get(hw,3.6)
        road.append(ln.buffer(max(2.35,radius)))
        road_centres.append(ln.buffer(1.85))
    elif closed and (t.get("landuse")=="grass" or t.get("leisure")=="garden"):grass.append(pg)
# Station concourse faces east across the plaza, beyond the old station's south wing.
# OSM relation 7307085 has three closed outer ways: the north hall, main concourse and south wing.
for i,kind,height in [(331969674,"stationWing",14.8),(331947843,"terminal",19.8),(170403784,"stationWing",16)]:
    outline=poly(i)
    buildings.append(dict(id=i,name="서울역",kind=kind,height=height,rings=rings(outline)))
    built.append(outline)
gate=Polygon(ways[233625717][1]+ways[1487802248][1][1:]).buffer(0)
buildings.append(dict(id="gate",name="숭례문",kind="gate",height=20,rings=rings(gate)));built.append(gate)
asphalt=merge(road)
# Cover the public shoulders up to the facade, preserving all surveyed sides of each junction.
walk.append(asphalt.buffer(5.7).difference(asphalt))
walk.append(LineString([(32,1423),(28,1452),(18,1460),(15,1464)]).buffer(5))
# Public approaches to the subway stairs and racks are wider than the tagged centre lines.
walk.extend([LineString([(17.7,1415.4),(28,1416),(35,1416)]).buffer(3.5),
             LineString([(52,1272),(52,1282),(44,1287)]).buffer(3.0),
             LineString([(110,1411),(110.4,1434),(108,1447)]).buffer(2.1),
             LineString([(230,848.7),(230,854),(236.7,863)]).buffer(3.2)])
# Station-side arm of the Tongil-ro junction and the ground-level sidewalk below Seoullo.
# Keep the elevated deck out of the ground navigation geometry.
cross.extend([(LineString([(81,1168),(55,1199)]).buffer(2.6,cap_style="square"),2.27),
              (LineString([(151,1230),(156,1265)]).buffer(2.5,cap_style="square"),1.43)])
walk.extend([LineString([(88,1139),(83,1150),(81,1168)]).buffer(3),
             LineString([(55,1199),(49,1209),(43,1215)]).buffer(3.2),
             LineString([(151,1223),(151,1230)]).buffer(3)])
squares.append(Polygon([(9,1416),(61,1417),(63,1468),(43,1503),(8,1506),(14,1474)]))
# Pave the full apron along the angled five-door entrance, including its south end.
def terminal_apron(x,z):
    c,s=math.cos(2.22),math.sin(2.22)
    return (15+x*c+z*s,1485.4-x*s+z*c)
squares.append(Polygon([terminal_apron(x,z) for x,z in [(-23,4),(23,4),(23,15),(-23,15)]]))
# The main gate sits on a landscaped island with a broad, paved forecourt.
squares.append(gate.buffer(12).intersection(Polygon([(280,890),(330,837),(363,816),(379,834),(357,892),(316,928),(280,931)])))
for n in root.findall("node"):
    p=nodes[n.get("id")]
    if tags(n).get("natural")=="tree" and scope.covers(Point(p)):trees.append(p)
used=merge(built)
surfaces=[]
def add(kind,shape,angle=None):
    global used
    cleaned=set_precision(shape.intersection(scope).difference(used),.02)
    used=used.union(cleaned)
    for part in parts(cleaned):
        # Clip at grid boundaries to keep both rendering and collision lookup local.
        a,b,c,d=part.bounds
        for x in range(math.floor(a/80)*80,math.ceil(c/80)*80,80):
            for y in range(math.floor(b/80)*80,math.ceil(d/80)*80,80):
                for cell in parts(part.intersection(box(x,y,x+80,y+80))):
                    obj={"kind":kind,"rings":rings(cell.simplify(.035,preserve_topology=True))}
                    if angle is not None:obj["angle"]=angle
                    surfaces.append(obj)
for shape,angle in cross:add("crossing",shape,angle)
crossing_lines.extend([[[81,1168],[55,1199],5.2],[[151,1230],[156,1265],5]])
# Keep vehicle access through pedestrian aprons, alleys and forecourt drop-off areas.
# Only mapped zebra crossings get stripes; raised bus islands retain their own paving.
add("shared",merge(walk+squares+taxi_aprons).intersection(merge(road_centres)))
add("stone",merge(platforms+squares))
# Transit-only carriageways serve the islands even when general motor access is prohibited.
# Pedestrians cross these lanes only at marked crossing sections.
busways.append(LineString([(213,987),(204.1,1000.7),(196.6,1012.2)]).buffer(1.75))
add("road",merge(busways))
# Mapped footways can run through a generalized carriageway buffer.
add("path",merge(walk))
add("road",asphalt)
add("stone",merge(public_squares))
add("grass",merge(grass+parks))
add("path",scope.intersection(asphalt.buffer(10.5)))
add("verge",scope)
out=Path(__file__).resolve().parents[1]/"public"/"station-data.js"
with out.open("w",encoding="utf8") as f, out.with_name("station-lanes.js").open("w",encoding="utf8") as lanes_file:
    lanes_file.write("// Geometry © OpenStreetMap contributors, ODbL 1.0. Generated by scripts/bake-station.py.\n")
    f.write("// Geometry © OpenStreetMap contributors, ODbL 1.0. Generated by scripts/bake-station.py.\n")
    for key,value in [("stationSurfaces",surfaces),("stationBuildings",buildings),("stationTrees",trees),
                      ("seoulloDeck",ways[550625236][1]),("southbound",sum([ways[i][1][:-1] for i in (619147732,517634898,899373686,619147734,198566324,585341917,619147736,585341901,585341904,796927124,1206223944,331947407)],[])+[(81.4,1298.8)]),
                      ("transferArrival",ways[615671505][1][1:4]+ways[331990404][1][1:5]+ways[1206220507][1][1:]+[(140.17,1465.33)]+ways[331994926][1][1:4]),
                      ("transferDeparture",ways[331994926][1][4:]+[(119.53,1251.49)]),
                      ("stationCrossings",crossing_lines),("northbound",sum([ways[i][1][:-1] for i in (1206223947,615671503,218926711,619147727,919984684,619147729,619147735,908622900)],[])+[(504.2,318.8)])]:
        (lanes_file if key in ("southbound","northbound","transferArrival","transferDeparture","stationCrossings") else f).write("export const "+key+"="+dumped(value)+";\n")
print(len(buildings),"buildings,",len(surfaces),"ground polygons,",len(cross),"crossings")
