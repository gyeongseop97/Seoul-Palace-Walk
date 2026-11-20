"""Bake the Seoul Station approach from an OSM /map XML extract (Shapely 2).
BBox 126.96790,37.55120,126.9788,37.56525. Coordinates are metres in layout.js.
The original geometry is © OpenStreetMap contributors, ODbL 1.0.
"""
import json
import math
import sys
import subprocess
from shapely.prepared import prep
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
    if shape.geom_type=="Polygon": return [shape] if shape.area>.0002 else []
    return [part for g in getattr(shape,"geoms",[]) for part in parts(g)]
def rings(shape):
    return [[[round(x,2),round(y,2)] for x,y in list(r.coords)[:-1]] for r in [shape.exterior,*shape.interiors]]
def merge(shapes):
    return unary_union([set_precision(p,.02) for p in shapes if not p.is_empty])
def dumped(value): return json.dumps(value,ensure_ascii=False,separators=(",",":"))

# Use the same door, stair and facade coordinates as the renderer. A cadastral
# outline includes outdoor terraces and overpasses in its plan projection.
project=Path(__file__).resolve().parents[1]
plan=json.loads(subprocess.check_output([
    "node","--input-type=module","-e",
    "import * as plan from './public/station-approach-plan.js';console.log(JSON.stringify(plan))"
],cwd=project,encoding="utf8"))
approaches=plan["stationApproaches"]
def strip(s):
    return LineString([s["a"],s["b"]]).buffer(s["w"]/2,cap_style="flat")
def local_point(x,y,angle,u,v):
    return (x+u*math.cos(angle)+v*math.sin(angle),y-u*math.sin(angle)+v*math.cos(angle))
def local_box(x,y,angle,u0,u1,v0,v1):
    return Polygon([local_point(x,y,angle,u,v) for u,v in [(u0,v0),(u1,v0),(u1,v1),(u0,v1)]])
decks=merge([Polygon(plan["eastPlazaOutline"])]+[strip(s).buffer(.18,join_style="mitre") for s in approaches if s["kind"]=="deck"])
flights=merge([strip(s) for s in approaches if s["kind"]!="deck"])
decks=decks.difference(flights)
door=plan["eastDoor"]
cx,cy=local_point(door["x"],door["y"],2.22,-14,-2.5)
decks=decks.difference(local_box(cx,cy,2.22,-23.5,23.5,-6,4.16))
kiosks=[]
for front in [plan["plazaCafeFront"],plan["outletFront"]]:
    kiosk=local_box(front["x"],front["y"],front["angle"],-front["w"]/2,front["w"]/2,-front["d"],.12)
    kiosks.append(kiosk)
    decks=decks.difference(kiosk)
clearance=merge([decks,flights,*kiosks]).buffer(1.05,join_style="mitre")
spine=LineString([(485,380),(476,425),(381,748),(347,805),(291,858),(249,947),(106,1189),(105,1340),(104,1537)])
scope=spine.buffer(66).union(box(-19,1201,206,1518)).intersection(box(-100,399,610,1530))
# West taxi plaza, both sides of Hangang-daero and the approaches to exits 10–15.
scope=scope.union(box(-248,1260,218,1730))
# Meet both existing mapped city-hall subway pavements at the southern kerb line.
joins=[LineString([(434,404),(443,409),(457,416),(459,427)]).buffer(3.2),
       LineString([(519,394),(511,403),(502,421),(496,435)]).buffer(3.6)]
scope=scope.union(merge(joins))
# Off-stage gallery and arcade floors occupy some outlying, non-corridor plots.
for bounds in [(309,437,393,547),(512,503.8,528,526.2),(472,569.8,488,592.2),(531,570,547,593)]:
    scope=scope.difference(box(*bounds))
context=scope.buffer(52)
busways=[];road_centres=[];public_squares=[];parks=[]
road_axes=[];foot_axes=[];restricted=[];planted=[];rail_yard=[]
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
        body=pg.simplify(.14,preserve_topology=True)
        for part in parts(body.difference(clearance) if body.intersects(clearance) else body):
            buildings.append(dict(id=i,name=t.get("name",""),kind=kind,height=round(height,1),rings=rings(part)))
            built.append(part)
        continue
    if not scope.intersects(ln) and not (closed and pg.intersects(scope)):continue
    if t.get("layer","0").startswith("-") or t.get("tunnel") or t.get("bridge"):continue
    if closed and (t.get("access") in ("no","private") or t.get("natural")=="water" or t.get("landuse")=="railway"):
        restricted.append(pg)
    if t.get("railway") in ("rail","siding") and t.get("location")!="underground":
        rail_yard.append(ln.buffer(3))
    if closed and (t.get("landuse")=="flowerbed" or t.get("leisure")=="garden" or t.get("natural")=="shrubbery"):
        planted.append(pg)
    hw=t.get("highway")
    if hw=="busway" and (t.get("bus") in ("yes","designated","permissive") or t.get("access") not in ("no","private")):
        busways.append(ln.buffer(1.85));road_axes.append((ln,1.85));continue
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
            walk.append(ln.buffer(2.4))
            crossing_lines.append([pts[0],pts[-1],4.7])
            bends=list(ln.simplify(.32).coords)
            for a,b in zip(bends,bends[1:]):
                dx,dy=b[0]-a[0],b[1]-a[1]
                if math.hypot(dx,dy)<.05:continue
                cross.append((LineString([a,b]).buffer(2.35,cap_style="flat"),round(math.atan2(dy,dx),4)))
        else:
            walk.append(ln.buffer(2.25));foot_axes.append(ln)
    elif hw in ("primary","trunk","secondary","tertiary","residential","service","living_street","unclassified","primary_link","secondary_link"):
        defaults={"primary":9.2,"trunk":10,"secondary":7,"tertiary":5.5,"service":2.8}
        lanes=t.get("lanes","")
        radius=min(10.6,float(lanes)*1.58) if lanes.isdigit() else defaults.get(hw,3.6)
        road.append(ln.buffer(max(2.35,radius)));road_axes.append((ln,max(2.35,radius)))
        road_centres.append(ln.buffer(1.85))
    elif closed and (t.get("landuse")=="grass" or t.get("leisure")=="garden"):grass.append(pg)
# Station concourse faces east across the plaza, beyond the old station's south wing.
# OSM relation 7307085 has three closed outer ways: the north hall, main concourse and south wing.
for i,kind,height in [(331969674,"stationWing",14.8),(331947843,"terminal",19.8),(170403784,"stationWing",16)]:
    outline=poly(i)
    for part in parts(outline.difference(clearance) if outline.intersects(clearance) else outline):
        buildings.append(dict(id=i,name="서울역",kind=kind,height=height,rings=rings(part)))
        built.append(part)
gate=Polygon(ways[233625717][1]+ways[1487802248][1][1:]).buffer(0)
g=plan["gatePose"]
def gate_box(u0,u1,v0,v1): return local_box(g["x"],g["y"],g["angle"],u0,u1,v0,v1)
for side in [-1,1]:
    spring,edge=sorted([side*g["opening"],side*22])
    wing0,wing1=sorted([side*21,side*31])
    pier=gate_box(spring,edge,-g["depth"]/2,g["depth"]/2).union(gate_box(wing0,wing1,-3.5,3.5))
    buildings.append(dict(id="gate",name="숭례문",kind="gate",height=20,rings=rings(pier)))
    built.append(pier)
squares.append(gate_box(-g["opening"],g["opening"],-20,20))
asphalt=merge(road)
# Many side-street zebras are recorded as nodes on the carriageway only.
# Follow a nearby crossing footway if present, otherwise use the road normal.
mapped_crossings=merge([p for p,_ in cross])
unpainted=[]
for n in root.findall("node"):
    tag=tags(n)
    if tag.get("highway")!="crossing" or tag.get("crossing")=="no":continue
    x,y=nodes[n.get("id")];pt=Point(x,y)
    if not scope.covers(pt) or pt.distance(mapped_crossings)<1:continue
    nearby=[(ln.distance(pt),ln,r) for ln,r in road_axes if ln.distance(pt)<1.5]
    if not nearby:continue
    _,ln,r=min(nearby,key=lambda item:item[0])
    t=ln.project(pt);a=ln.interpolate(max(0,t-3));b=ln.interpolate(min(ln.length,t+3))
    angle=math.atan2(b.y-a.y,b.x-a.x)+math.pi/2
    foot=[path for path in foot_axes if path.distance(pt)<2.3]
    if foot:
        path=min(foot,key=lambda line:line.distance(pt));t=path.project(pt)
        a=path.interpolate(max(0,t-3));b=path.interpolate(min(path.length,t+3))
        hint=math.atan2(b.y-a.y,b.x-a.x)
        if abs(math.cos(angle-hint))>.72:angle=hint
    dx,dy=math.cos(angle),math.sin(angle)
    ends=[(x+sign*(r+1.4)*dx,y+sign*(r+1.4)*dy) for sign in (-1,1)]
    span=LineString(ends);width=4.4 if r>5 else 3.5
    shape=span.buffer(width/2,cap_style="flat")
    if tag.get("crossing:markings")=="no" or tag.get("crossing")=="unmarked":unpainted.append(shape)
    else:
        cross.append((shape,round(angle,4)))
        crossing_lines.append([list(ends[0]),list(ends[1]),width])
    walk.extend(Point(end).buffer(width*.75) for end in ends)
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
# Cut the subway escalator well from every at-grade paving layer.
down=LineString([(17.7,1415.4),(34.7,1407.7)]).buffer(2.22,cap_style="flat")
used=merge(built+[down])
squares.extend([box(23.6,1311.5,40,1335),LineString([(-182.5,1322.2),(-190,1322.2),(-205,1323),(-211,1330)]).buffer(3.1),
                Polygon([(-201,1499),(-168,1499),(-160,1523),(-195,1557),(-204,1546)]),
                LineString([(-196.2,1592.1),(-198,1578),(-201,1547)]).buffer(3),
                LineString([(26.5,1323),(40,1323),(42,1290),(14,1260)]).buffer(3.2)])
for px,py,heading in [(199.83,1524.46,180),(142.71,1593.60,180),(108.93,1697.06,0),
                      (70.54,1683.50,0),(84.52,1579.23,180),(-196.16,1592.12,0),(12.60,1260.83,90)]:
    a=math.radians(heading)
    walk.append(LineString([(px,py),(px+7*math.sin(a),py+7*math.cos(a))]).buffer(2.6))
surfaces=[]
def add(kind,shape,angle=None):
    global used
    cleaned=set_precision(shape,.02).intersection(set_precision(scope,.02)).difference(used)
    used=used.union(cleaned)
    for part in parts(cleaned):
        # Clip at grid boundaries to keep both rendering and collision lookup local.
        a,b,c,d=part.bounds
        for x in range(math.floor(a/80)*80,math.ceil(c/80)*80,80):
            for y in range(math.floor(b/80)*80,math.ceil(d/80)*80,80):
                for cell in parts(part.intersection(box(x,y,x+80,y+80))):
                    obj={"kind":kind,"rings":rings(cell)}
                    if angle is not None:obj["angle"]=angle
                    surfaces.append(obj)
carriageways=asphalt.union(merge(busways)).buffer(.14)
for shape,angle in cross:
    # Paint up to the kerb; the remainder of the same crossing is its paved landing.
    paint=shape.intersection(carriageways)
    add("crossing",paint if paint.area>.5 else shape,angle)
    walk.append(shape)
add("shared",merge(unpainted))
crossing_lines.extend([[[81,1168],[55,1199],5.2],[[151,1230],[156,1265],5]])
# Keep vehicle access through pedestrian aprons, alleys and forecourt drop-off areas.
# Only mapped zebra crossings get stripes; raised bus islands retain their own paving.
# Follow the entire kerb-to-kerb drop-off lane across the forecourt.
apron=box(-6,1400,57,1504)
shared_roads=merge(road_centres).difference(apron).union(asphalt.intersection(apron))
add("shared",merge(walk+squares+taxi_aprons).intersection(shared_roads))
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
# Continue sidewalks across the public frontage between the kerb, nearby
# mapped footways, and building lines. Exclude rail land, water and planting.
excluded=merge(restricted+planted+rail_yard)
frontage=asphalt.buffer(12.5).union(merge(foot_axes).buffer(6.5)).difference(excluded)
add("path",scope.intersection(frontage))
add("verge",scope)
# Reuse surveyed trees first. Fill long bare blocks of the Sejong-daero
# pedestrian corridor at the pavement edge, keeping junction sight lines clear.
avenue=merge([LineString(pts) for t,pts in ways.values() if len(pts)>1 and
              t.get("name") in ("세종대로","통일로","한강대로") and t.get("highway") in ("primary","secondary","trunk")])
def surface_union(kinds):
    return merge([Polygon(s["rings"][0],s["rings"][1:]).buffer(0) for s in surfaces if s["kind"] in kinds])
plantable=prep(surface_union({"path","stone","grass","verge"}).difference(
    merge([merge(built).buffer(3.0),merge([p for p,_ in cross]).buffer(4),clearance.buffer(2.5),excluded,down])))
street_trees=[]
def plant(x,y,spacing):
    if not plantable.covers(Point(x,y)) or any(math.hypot(x-px,y-py)<spacing for px,py in street_trees):return False
    street_trees.append([round(x,2),round(y,2)]);return True
for x,y in trees:plant(x,y,5.4)
for path in foot_axes:
    if path.length<21 or path.distance(avenue)>22:continue
    for n in range(9,int(path.length)-4,16):
        pt=path.interpolate(n)
        if pt.y<401 or pt.y>1475 or pt.distance(avenue)>27:continue
        a,b=path.interpolate(n-1),path.interpolate(n+1)
        angle=math.atan2(b.y-a.y,b.x-a.x)+math.pi/2
        dx,dy=math.cos(angle)*2.7,math.sin(angle)*2.7
        sides=sorted([(pt.x+dx,pt.y+dy),(pt.x-dx,pt.y-dy)],key=lambda p:asphalt.distance(Point(p)))
        for x,y in sides:
            if plant(x,y,10.5):break
trees=street_trees
out=Path(__file__).resolve().parents[1]/"public"/"station-data.js"
terraces=[{"kind":"deck","rings":rings(p)} for p in parts(decks)]
out.with_name("station-terraces.js").write_text("// Generated by scripts/bake-station.py from the public approach plan.\nexport const stationTerraces="+dumped(terraces)+";\n",encoding="utf8")
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
