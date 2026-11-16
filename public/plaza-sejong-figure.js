// Game sculpture based on the pose, silhouette and dimensions recorded by Seoul Future Heritage.
// The throne and king occupy 4.3 × 6.2 metres above the granite pedestal, facing south (+Z).
const turn=Math.PI*2;
const bell=(value,width)=>Math.exp(-((value/width)**2));

// Closed sections share normals so the major shapes read as cast bronze from nearby.
function shell(T,rows,sides,point){
  const vertices=[],faces=[];
  for(let row=0;row<=rows;row++)for(let i=0;i<sides;i++){
    vertices.push(...point(row/rows,i*turn/sides));
    if(!row)continue;
    const a=(row-1)*sides+i,b=(row-1)*sides+(i+1)%sides;
    faces.push(a,b,a+sides,b,b+sides,a+sides);
  }
  const top=rows*sides;
  for(let i=1;i<sides-1;i++)faces.push(0,i+1,i,top,top+i,top+i+1);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(faces);geometry.computeVertexNormals();
  return geometry;
}

function profile(T,sections,contour=()=>[0,0]){
  const curve=new T.CatmullRomCurve3(sections.map(([y,width,depth])=>new T.Vector3(y,width,depth)));
  const spine=new T.CatmullRomCurve3(sections.map(([y,,,z=0,x=0])=>new T.Vector3(x,y,z)));
  return shell(T,(sections.length-1)*4,48,(progress,angle)=>{
    const {x:y,y:width,z:depth}=curve.getPoint(progress),center=spine.getPoint(progress);
    const [gather,drape]=contour(progress,angle>Math.PI?angle-turn:angle);
    return [center.x+Math.sin(angle)*(width+gather),y+drape,center.z+Math.cos(angle)*(depth+gather)];
  });
}

function sweep(T,sections,rows=18,sides=15,fold=0){
  const spine=new T.CatmullRomCurve3(sections.map(([x,y,z])=>new T.Vector3(x,y,z)));
  const width=new T.CatmullRomCurve3(sections.map((section,i)=>new T.Vector3(section[3],section[4]??section[3],i)));
  const frames=spine.computeFrenetFrames(rows,false);
  return shell(T,rows,sides,(progress,angle)=>{
    const frame=Math.round(progress*rows),center=spine.getPointAt(progress),radius=width.getPoint(progress);
    const wrinkle=fold*Math.sin(angle*7+progress*8.5)*Math.sin(progress*Math.PI);
    return center.addScaledVector(frames.binormals[frame],Math.sin(angle)*(radius.x+wrinkle))
      .addScaledVector(frames.normals[frame],Math.cos(angle)*(radius.y+wrinkle)).toArray();
  });
}

function humanFace(T){
  const geometry=new T.SphereGeometry(1,40,30),vertices=geometry.attributes.position;
  const feature=(x,y,cx,cy,sx,sy)=>bell(x-cx,sx)*bell(y-cy,sy);
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),side=Math.abs(x);
    const jaw=1-.14*bell(y+.86,.39)+.065*bell(y+.15,.36);
    const shaping=.08*feature(side,y,.49,-.24,.24,.23)-.07*feature(side,y,.39,.20,.22,.14)
      +.065*feature(side,y,.38,.35,.27,.11)+.115*feature(x,y,0,.08,.13,.35)
      +.19*feature(x,y,0,-.127,.182,.15)+.067*feature(x,y,0,-.50,.35,.16);
    vertices.setXYZ(i,x*jaw,y,z+shaping*Math.max(z,0)**3);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function sculptSejong(T,model,{gold,goldEdge,goldShade}){
  function mesh(material,geometry){
    model.part(geometry,material,0,0,0,1,1,1);
    geometry.dispose();
  }
  function curve(material,coords,radius){
    const path=new T.CatmullRomCurve3(coords.map(point=>new T.Vector3(...point)));
    mesh(material,new T.TubeGeometry(path,Math.max(5,coords.length*2),radius,radius>.021?6:4,false));
  }
  function panel(x,y,z,w,h,angle){
    const c=Math.cos(angle),s=Math.sin(angle);
    const plane=(u,v,d)=>[x+c*u+s*d,y+v,z-s*u+c*d];
    model.box(goldShade,x,y,z,w,h,.068,0,angle);
    model.box(gold,...plane(0,0,.041),w-.083,h-.086,.036,0,angle);
    const frame=[[.46,-.34],[.40,-.43],[-.40,-.43],[-.46,-.34],[-.46,.34],[-.40,.43],[.40,.43],[.46,.34],[.46,-.34]];
    curve(goldEdge,frame.map(([u,v])=>plane(u*w,v*h,.064)),.014);
    const curls=[[-.35,-.19],[-.18,-.08],[.03,-.20],[.23,-.17],[.31,.023],[.21,.181],
      [.04,.231],[-.12,.128],[-.092,.025],[.055,.04],[.139,.132]];
    curve(goldEdge,curls.map(([u,v])=>plane(u*w,v*h,.068)),.023);
    curve(gold,curls.slice(2,9).map(([u,v])=>plane((u+.024)*w,(v-.079)*h,.081)),.016);
    curve(goldEdge,[[.086,.077],[.160,.109],[.189,.174],[.243,.159]].map(([u,v])=>plane(u*w,v*h,.080)),.014);
    curve(goldEdge,[[.126,.137],[.141,.221],[.182,.26]].map(([u,v])=>plane(u*w,v*h,.084)),.013);
    for(const [u,v,k] of [[-.32,.24,1],[.33,-.25,-1],[-.29,-.31,1],[.30,.28,-1]]){
      curve(goldEdge,[[u-.048*k,v-.06],[u+.021*k,v-.031],[u+.049*k,v+.032],[u+.001*k,v+.09]]
        .map(([p,q])=>plane(p*w,q*h,.073)),.011);
    }
  }

  // Broad and low throne, with separate end rails, relief cartouches and a four-panel footrest.
  model.box(goldShade,0,.067,-.10,4.30,.134,3.20);
  model.box(gold,0,1.04,-.38,3.83,1.95,2.24);
  model.box(goldShade,0,2.37,-1.35,3.95,2.55,.25);
  model.box(gold,0,3.64,-1.37,3.23,.24,.29);
  model.box(goldShade,0,.410,1.29,2.94,.74,.77);
  model.box(goldEdge,0,.791,1.29,3.00,.077,.80);
  for(let i=0;i<4;i++)panel((i-1.5)*.716,.416,1.685,.685,.62,0);
  for(const side of [-1,1]){
    model.box(goldEdge,side*1.91,1.66,-.31,.31,.159,2.32);
    model.box(gold,side*1.92,2.343,-.38,.19,1.30,2.12);
    model.box(gold,side*1.97,3.01,-.37,.26,.17,2.24);
    for(const z of [-1.36,.676]){
      model.rod(goldShade,[side*1.94,1.67,z],[side*1.94,3.30,z],.093);
      model.oval(gold,side*1.94,3.31,z+.025,.15,.17,.165,0,0,side*.14);
      curve(goldEdge,[[side*1.96,3.24,z+.17],[side*2.023,3.35,z+.087],[side*1.92,3.45,z+.01]],.034);
    }
    panel(side*2.033,2.351,-.36,1.90,1.16,side*Math.PI/2);
    panel(side*1.925,.976,-.36,1.88,1.24,side*Math.PI/2);
    panel(side*1.62,2.77,-1.514,.68,1.10,Math.PI);
    panel(side*1.34,1.60,-1.514,1.29,1.08,Math.PI);
    panel(side*1.34,.50,-1.514,1.29,.89,Math.PI);
    model.oval(gold,side*.95,.887,1.342,.35,.229,.39,-.14,side*.11);
    curve(goldEdge,[[side*.79,.96,1.64],[side*.93,1.083,1.58],[side*1.03,1.116,1.472]],.023);
  }
  panel(0,3.53,-1.54,2.76,.41,Math.PI);
  panel(0,2.75,-1.514,2.50,1.12,Math.PI);
  panel(0,1.595,-1.514,1.30,1.08,Math.PI);
  panel(0,.50,-1.514,1.30,.89,Math.PI);

  // Long uninterrupted folds descend from two bent knees. The dip between them softens the lap.
  const folds=[[-1.19,.124,.141],[-.87,.112,.082],[-.64,.22,.179],[-.31,.15,-.123],
    [0,.070,-.038],[.31,.161,-.099],[.61,.21,.170],[.88,.12,.113],[1.18,.112,.127]];
  mesh(gold,profile(T,[[.72,1.42,1.10,.35],[.82,1.62,1.19,.32],[1.19,1.64,1.04,.34],
    [1.67,1.53,.98,.38],[2.17,1.52,.89,.36],[2.57,1.46,.81,.30],[2.94,1.37,.75,.25],
    [3.13,1.18,.66,.14],[3.17,.44,.44,-.03]],(t,angle)=>{
      const front=Math.max(0,Math.cos(angle)),vertical=Math.sin(t*Math.PI);
      const drape=folds.reduce((sum,[a,w,r])=>sum+r*bell(angle-a-.13*Math.sin(t*4+a),w),0);
      const knee=bell(angle-.64,.252)+bell(angle+.66,.254);
      const acrossLap=.265*bell(t-.77,.183)+.037*t+.075*(1-t)**6;
      const diagonal=Math.abs(angle)-(.115+.68*t);
      const valley=(.151*bell(diagonal,.123)-.104*bell(diagonal+.151,.115))*vertical**.81;
      return [drape*(.49+vertical*.51)+valley+.014*Math.sin(17*angle+t*4),front*knee*acrossLap];
    }));
  mesh(gold,profile(T,[[2.78,.75,.43,-.11],[2.95,.89,.57,-.11],[3.17,1.08,.62,-.13],
    [3.54,1.14,.66,-.13],[3.92,1.17,.62,-.15],[4.23,1.12,.54,-.18],
    [4.49,.82,.44,-.16],[4.62,.42,.34,-.13]],(t,a)=>[.047*Math.sin(a*7+t*5)*Math.sin(t*Math.PI),0]));
  mesh(goldShade,profile(T,[[3.10,.94,.60,-.13],[3.18,1.10,.647,-.13],[3.27,1.12,.655,-.13],
    [3.34,1.12,.638,-.13]],(t,a)=>[.023*Math.cos(9*a+t),.025*Math.cos(a)]));
  model.box(goldEdge,.09,3.232,.543,.225,.126,.035,0,0,-.10);

  // The dragon emblem follows the rounded gonryongpo chest instead of floating as a flat shield.
  const chest=(x,y)=>[x,3.844+y,.536-.181*(x/.66)**2-.085*(y/.63)**2];
  const frame=Array.from({length:17},(_,i)=>{
    const a=i*turn/16;
    return chest(Math.sin(a)*.57,Math.cos(a)*.475);
  });
  curve(goldEdge,frame,.022);
  curve(goldEdge,[[-.39,-.17],[-.11,-.31],[.25,-.24],[.39,-.05],[.23,.24],[-.09,.25],[-.27,.12],
    [-.14,-.045],[.14,.03],[.24,.12]].map(([x,y])=>chest(x,y)),.039);
  for(const s of [-1,1])for(const level of [-.22,.07,.28]){
    curve(goldEdge,[[s*.25,level-.074],[s*.38,level-.09],[s*.45,level],[s*.37,level+.042]]
      .map(([x,y])=>chest(x,y)),.013);
  }

  // The right hand extends toward the square and the left forearm supports the open book.
  mesh(gold,sweep(T,[[-.79,4.18,-.13,.34,.41],[-1.17,4.14,.13,.55,.59],
    [-1.42,4.11,.43,.53,.61],[-1.49,4.17,.73,.47,.59],[-1.54,4.34,1.05,.39,.52],
    [-1.56,4.53,1.31,.32,.41],[-1.56,4.64,1.435,.272,.324]],23,24,.07));
  mesh(gold,sweep(T,[[.89,4.23,-.15,.337,.42],[1.23,4.01,-.02,.45,.53],[1.46,3.67,.19,.47,.48],
    [1.63,3.34,.53,.41,.43],[1.52,3.27,.84,.34,.36],[1.38,3.29,1.20,.26,.30]],20,23,.058));
  mesh(gold,sweep(T,[[-1.55,4.65,1.37,.141,.153],[-1.54,4.76,1.56,.200,.154],
    [-1.54,4.88,1.72,.179,.123],[-1.54,4.93,1.78,.121,.097]],14,20));
  for(let i=0;i<4;i++){
    const x=-1.676+i*.079,y=4.922+i*.063,reach=[.19,.26,.26,.18][i];
    mesh(gold,sweep(T,[[x,y-.08,1.69,.055],[x-.014,y,1.788,.056],[x-.009,y+.046,1.81+reach*.69,.048],
      [x+.02,y+.077,1.802+reach,.018]],10,10));
  }
  mesh(gold,sweep(T,[[-1.41,4.839,1.62,.083],[-1.35,4.94,1.71,.071],[-1.32,5.02,1.81,.053],
    [-1.322,5.075,1.85,.016]],11,11));
  model.oval(gold,1.42,3.303,1.29,.262,.126,.223,0,-.31,.27);
  for(let i=0;i<4;i++){
    const x=1.23+i*.099;
    curve(gold,[[x,3.324+i*.035,1.27],[x+.056,3.320+i*.032,1.42],[x+.096,3.378+i*.031,1.47]],.04);
  }
  sculptBook(T,model,gold,goldEdge,goldShade);

  model.oval(gold,0,4.62,-.143,.300,.277,.281);
  curve(goldShade,[[-.286,4.565,.025],[-.21,4.512,.14],[0,4.469,.194],[.208,4.518,.138],[.284,4.575,.025]],.017);
  const face=humanFace(T);
  model.part(face,gold,0,5.083,-.077,.424,.532,.404);face.dispose();
  for(const s of [-1,1]){
    model.oval(gold,s*.41,5.078,-.10,.084,.183,.108,0,0,s*.095);
    curve(goldShade,[[s*.442,5.183,-.003],[s*.467,5.107,.003],[s*.438,5.019,-.004]],.013);
    curve(goldShade,[[s*.085,5.172,.309],[s*.161,5.198,.314],[s*.235,5.182,.278],[s*.275,5.164,.234]],.014);
    curve(goldEdge,[[s*.078,5.268,.316],[s*.173,5.291,.304],[s*.289,5.265,.247]],.022);
    curve(goldShade,[[s*.013,4.968,.339],[s*.083,4.986,.335],[s*.16,4.956,.307],[s*.22,4.923,.273]],.023);
  }
  curve(goldShade,[[-.118,4.912,.296],[-.061,4.929,.326],[0,4.916,.336],[.063,4.925,.323],[.126,4.921,.293]],.014);
  mesh(goldShade,profile(T,[[4.472,.034,.027,.202],[4.55,.114,.067,.199],[4.658,.184,.115,.182],
    [4.78,.214,.115,.165],[4.905,.193,.085,.166]],(t,a)=>[Math.sin(a*13+t*4)*.013*Math.sin(t*Math.PI),0]));
  for(const x of [-.151,-.091,-.041,.024,.072,.133])curve(goldEdge,[[x,4.867,.253],[x*.94,4.755,.286],
    [x*.61,4.629,.285],[x*.27,4.536,.232]],.013);

  // Rounded forehead panel and two upturned rear folds of the ikseongwan.
  mesh(gold,profile(T,[[5.340,.405,.348,-.091],[5.427,.452,.371,-.109],[5.561,.452,.388,-.127],
    [5.742,.407,.341,-.160],[5.865,.304,.271,-.222],[5.95,.183,.180,-.246]]));
  for(const s of [-1,1]){
    model.oval(gold,s*.171,5.887,-.281,.186,.265,.257,-.15,0,-s*.036);
    model.oval(goldShade,s*.127,5.916,-.474,.094,.284,.041,.15,0,s*.093);
  }
  curve(goldShade,[[-.411,5.458,.019],[-.266,5.447,.193],[0,5.450,.257],[.266,5.446,.193],[.411,5.455,.019]],.018);
  model.finish();
}

function sculptBook(T,model,gold,goldEdge,goldShade){
  function leaf(side,u,v,depth){
    const bend=Math.sin(u*Math.PI)*.095;
    const x=1.08+side*u*.88;
    return [x,3.305+side*u*.355+bend+(v-.5)*.235+depth,1.111+(v-.5)*.83+side*u*.071];
  }
  const sides=10,rows=7;
  for(const side of [-1,1]){
    const positions=[],indices=[];
    for(const depth of [-.107,.014])for(let i=0;i<=sides;i++)for(let j=0;j<=rows;j++){
      positions.push(...leaf(side,i/sides,j/rows,depth));
    }
    const half=(sides+1)*(rows+1),w=rows+1;
    function quad(a,b,c,d,reverse){indices.push(...(reverse?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
    for(let i=0;i<sides;i++)for(let j=0;j<rows;j++){
      const a=i*w+j,b=a+w;
      quad(a,b,a+1,b+1,side<0);
      quad(a+half,b+half,a+1+half,b+1+half,side>0);
    }
    for(let i=0;i<sides;i++){
      const a=i*w,b=a+w;
      quad(a,a+half,b,b+half,side<0);
      quad(a+rows,a+rows+half,b+rows,b+rows+half,side>0);
    }
    for(let j=0;j<rows;j++){
      const a=sides*w+j;
      quad(a,a+half,a+1,a+1+half,side<0);
    }
    const pages=new T.BufferGeometry();pages.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    pages.setIndex(indices);pages.computeVertexNormals();
    model.part(pages,goldEdge,0,0,0,1,1,1);pages.dispose();
    for(const t of [-.107,-.058,-.008])for(let i=0;i<5;i++){
      model.rod(t===-.107?goldShade:gold,leaf(side,i/5,1,t),leaf(side,(i+1)/5,1,t),t===-.107?.017:.008);
    }
    for(let column=1;column<=6;column++){
      const u=.115+column*.112;
      for(let row=1;row<=5;row++){
        const v=row*.137+.085;
        model.rod(gold,leaf(side,u,v,.019),leaf(side,u+.046,v-.022,.019),.009);
      }
    }
  }
  model.rod(goldShade,leaf(1,0,0,-.083),leaf(1,0,1,-.083),.047);
}
