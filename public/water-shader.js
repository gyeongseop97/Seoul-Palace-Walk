// Shared pieces for the water around the walk: the stream, the palace ponds and the fountain basins.

// Value noise that stays crisp a few thousand metres from the origin.
export const waterNoise=`
  float hash(vec2 p){p=fract(p*vec2(.1371,.0917)+.13);p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x*7.31);}
  vec2 hash2(vec2 p){float n=hash(p);return vec2(n,hash(p*1.31+n*5.7+2.9));}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
  }
  float fbm(vec2 p){return .56*noise(p)+.29*noise(p*2.07+3.1)+.15*noise(p*4.31+7.7);}`;

// Distance to the nearest cell centre, the gap to the next one, and a tone for the cell.
// The gap is small along cell borders, which draws both pebble joints and nets of light.
export const waterCells=`
  vec3 cells(vec2 p){
    vec2 i=floor(p),f=fract(p);float best=8.,next=8.,tone=0.;
    for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
      vec2 g=vec2(float(x),float(y)),o=hash2(i+g);float d=length(g+o-f);
      if(d<best){next=best;best=d;tone=o.x;}else if(d<next)next=d;
    }
    return vec3(best,next-best,tone);
  }`;

const vertexShader=`
  varying vec3 point;
  #include <fog_pars_vertex>
  void main(){
    point=(modelMatrix*vec4(position,1.)).xyz;
    vec4 mvPosition=modelViewMatrix*vec4(position,1.);
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
  }`;
// The sky as the water mirrors it, the share of it the surface returns, and the sun's glints.
const surface=`
  vec3 mirrored(vec3 mirror,vec2 p,float banks){
    float up=clamp(mirror.y,0.,1.);
    vec3 sky=mix(vec3(.74,.81,.80),vec3(.34,.54,.72),clamp(up*1.5,0.,1.));
    // Low in the reflection stand the trees and walls around the water.
    sky=mix(sky,vec3(.13,.19,.12),banks*(1.-smoothstep(.05,.26,up+(noise(p*.8)-.5)*.07)));
    return mix(sky,mix(vec3(.050,.080,.125),vec3(.028,.045,.085),up),night);
  }
  vec3 glints(vec3 eye,vec3 normal,vec2 p,float speed){
    vec3 sun=normalize(vec3(-.32,.64,.71));
    vec3 crisp=normalize(normal+vec3(noise(p*23.-clock*speed)-.5,0.,noise(p*23.+41.-clock*speed*.9)-.5)*.16);
    float glint=pow(max(0.,dot(reflect(-eye,crisp),sun)),170.)*2.4+pow(max(0.,dot(reflect(-eye,normal),sun)),22.)*.22;
    return mix(vec3(1.,.95,.80),vec3(.30,.36,.46),night)*glint*mix(1.,.35,night);
  }`;
const finish=`
  #include <colorspace_fragment>
  #include <fog_fragment>`;

function material(T,uniforms,fragmentShader){
  return new T.ShaderMaterial({
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{clock:{value:0},night:{value:0}},uniforms]),
    fog:true,vertexShader,fragmentShader
  });
}

// Still water for a pond: green and deep, with weed and silt showing faintly from above,
// a slow ripple from the wind, and the sky and the trees around it mirrored in the surface.
export function pondWater(T){
  return material(T,{},`
    uniform float clock,night;
    varying vec3 point;
    #include <fog_pars_fragment>
    ${waterNoise}
    ${surface}
    float swell(vec2 p){
      float t=clock;
      return fbm(p*.55+vec2(t*.07,t*.05))*.60+fbm(p*1.7+vec2(-t*.13,t*.09)+9.)*.30+noise(p*5.2+vec2(t*.30,-t*.22))*.10;
    }
    void main(){
      vec2 p=point.xz;
      float e=.09,h=swell(p);
      vec2 slope=vec2(swell(p+vec2(e,0.))-h,swell(p+vec2(0.,e))-h)/e;
      // The wind ruffles the pond in drifting bands and leaves glassy water between them.
      float ruffle=mix(.035,.21,smoothstep(.32,.68,fbm(p*.075+vec2(clock*.011,-clock*.007))));
      vec3 normal=normalize(vec3(-slope.x*ruffle,1.,-slope.y*ruffle));
      vec3 eye=normalize(cameraPosition-point);
      float facing=clamp(dot(normal,eye),0.,1.);
      vec2 bed=p-eye.xz/max(eye.y,.35)*.5-normal.xz*1.4;
      float weed=smoothstep(.35,.80,fbm(bed*.33+3.));
      vec3 ground=mix(vec3(.19,.19,.12),vec3(.07,.14,.06),weed)*(.72+.56*noise(bed*2.3));
      vec3 through=exp(-vec3(2.4,.9,1.6)*(.5/max(.4,facing)));
      vec3 body=ground*mix(.10,.55,1.-night)*through+mix(vec3(.026,.092,.068),vec3(.006,.020,.030),night);
      float fresnel=.04+.96*pow(1.-facing,4.2);
      vec3 color=mix(body,mirrored(reflect(-eye,normal),p,1.),fresnel*.9)+glints(eye,normal,p,1.1);
      gl_FragColor=vec4(color,1.);
      ${finish}
    }`);
}

// Clear, shallow water in a basin or a channel: the stone floor shows through with a bright net
// of light on it, and the surface is kept lively by the jets. bed holds the two stone tones,
// tile the number of paving stones per metre, tint the colour the water lends the floor.
export function basinWater(T,{bed=[0x9da39c,0xc3c6bb],tile=2.2,tint=0x2f8f9a,depth=.22}={}){
  return material(T,{bedDark:{value:new T.Color(bed[0])},bedLight:{value:new T.Color(bed[1])},
    tint:{value:new T.Color(tint)},tile:{value:tile},depth:{value:depth}},`
    uniform float clock,night,tile,depth;
    uniform vec3 bedDark,bedLight,tint;
    varying vec3 point;
    #include <fog_pars_fragment>
    ${waterNoise}
    ${waterCells}
    ${surface}
    float swell(vec2 p){
      float t=clock;
      return fbm(p*1.9+vec2(t*.34,-t*.27))*.55+fbm(p*4.6+vec2(-t*.62,t*.48)+9.)*.30+noise(p*11.+vec2(t*1.1,t*.9))*.15;
    }
    void main(){
      vec2 p=point.xz;
      float e=.05,h=swell(p);
      vec2 slope=vec2(swell(p+vec2(e,0.))-h,swell(p+vec2(0.,e))-h)/e;
      vec3 normal=normalize(vec3(-slope.x*.06,1.,-slope.y*.06));
      vec3 eye=normalize(cameraPosition-point);
      float facing=clamp(dot(normal,eye),0.,1.);
      vec2 bed=p-eye.xz/max(eye.y,.35)*depth*.72-normal.xz*depth*2.2;
      vec2 stone=bed*tile,joint=abs(fract(stone)-.5);
      vec3 ground=mix(bedDark,bedLight,hash(floor(stone)))*(1.-.30*smoothstep(.43,.49,max(joint.x,joint.y)));
      vec2 warp=vec2(fbm(bed*1.3+clock*.14),fbm(bed*1.3+17.-clock*.16));
      float net=cells(bed*2.1+warp*1.4+vec2(clock*.12,-clock*.09)).y;
      float fine=cells(bed*4.4-warp+vec2(-clock*.21,clock*.17)).y;
      float caustic=pow(1.-smoothstep(0.,.26,net),3.4)*.8+pow(1.-smoothstep(0.,.22,fine),4.)*.35;
      float day=1.-night,way=depth/max(.4,facing);
      vec3 lit=ground*(mix(.16,.66,day)+caustic*mix(.10,.95,day));
      vec3 clear=mix(vec3(1.),tint*2.2,clamp(way*1.7,0.,.85));
      vec3 body=lit*clear+tint*mix(.10,.03,night)*clamp(way*2.,0.,1.);
      float fresnel=.03+.97*pow(1.-facing,4.6);
      vec3 color=mix(body,mirrored(reflect(-eye,normal),p,0.),fresnel*.8)+glints(eye,normal,p,1.8);
      gl_FragColor=vec4(color,1.);
      ${finish}
    }`);
}

// A jet of water: a clear, bright column with streaks racing along it, breaking up toward its end.
// The geometry's uv runs around the jet in x and along it, from nozzle to splash, in y.
export function jetWater(T){
  return new T.ShaderMaterial({
    uniforms:{clock:{value:0},night:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    vertexShader:`
      varying vec2 along;
      varying float rim;
      void main(){
        along=uv;
        vec4 p=vec4(position,1.);
        vec3 n=normal;
        #ifdef USE_INSTANCING
          p=instanceMatrix*p;
          mat3 basis=mat3(instanceMatrix);
          n=basis*(normal/vec3(dot(basis[0],basis[0]),dot(basis[1],basis[1]),dot(basis[2],basis[2])));
        #endif
        vec4 mvPosition=modelViewMatrix*p;
        rim=1.-abs(dot(normalize(normalMatrix*n),normalize(-mvPosition.xyz)));
        gl_Position=projectionMatrix*mvPosition;
      }`,
    fragmentShader:`
      uniform float clock,night;
      varying vec2 along;
      varying float rim;
      ${waterNoise}
      void main(){
        float run=along.y*7.-clock*5.2;
        float streak=fbm(vec2(along.x*5.,run))*.6+noise(vec2(along.x*13.,run*2.3))*.4;
        // Solid at the nozzle, torn into drops as it falls.
        float broken=smoothstep(.45,1.,along.y);
        float body=mix(1.,smoothstep(.34,.62,streak),broken);
        float white=clamp(rim*.64+streak*.36+broken*.21,0.,1.);
        vec3 color=mix(vec3(.39,.64,.72),vec3(1.),white);
        color=mix(color,color*vec3(.46,.58,.78),night);
        gl_FragColor=vec4(color,body*(.22+.52*white)*(1.-smoothstep(.93,1.,along.y)));
        #include <colorspace_fragment>
      }`
  });
}
// A round, tapering tube along path(t), t from 0 to 1, with the uv a jet's water needs.
export function jetTube(T,path,{from=.03,to=.05,segments=16,sides=6}={}){
  const positions=[],normals=[],uvs=[],indices=[];
  const point=new T.Vector3(),ahead=new T.Vector3(),tangent=new T.Vector3(),side=new T.Vector3(),up=new T.Vector3(),out=new T.Vector3();
  for(let i=0;i<=segments;i++){
    const t=i/segments;
    path(t,point);path(Math.min(1,t+.02),ahead);
    if(t>.98){path(t-.02,tangent);tangent.subVectors(point,tangent);}else tangent.subVectors(ahead,point);
    tangent.normalize();
    side.set(tangent.z,0,-tangent.x);
    if(side.lengthSq()<1e-6)side.set(1,0,0);
    side.normalize();up.crossVectors(side,tangent);
    const radius=from+(to-from)*t;
    for(let j=0;j<=sides;j++){
      const angle=j/sides*Math.PI*2;
      out.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(up,Math.sin(angle));
      positions.push(point.x+out.x*radius,point.y+out.y*radius,point.z+out.z*radius);
      normals.push(out.x,out.y,out.z);uvs.push(j/sides,t);
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
    const a=i*(sides+1)+j,b=a+sides+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  return geometry;
}

// Keeps a set of water materials in step with the clock and the darkness of the night.
export function tickWater(materials,seconds,night){
  for(const {uniforms} of materials){uniforms.clock.value=seconds;uniforms.night.value=night;}
}
