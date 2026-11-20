import * as T from "three";
import {shore,spectrum,wave} from "./pohang-layout.js";
const nx=140,nz=350,startZ=-1650,dz=3000/nz;
const coastRows=Array.from({length:nz+1},(_,j)=>shore(startZ+j*dz));
const ranges=Array.from({length:nx+1},(_,i)=>-7+Math.pow(i/nx,1.65)*1900);
const amplitudes=ranges.map(d=>{const t=Math.max(0,Math.min(1,(d+5)/15));return t*t*(3-2*t);});
// Match the shader's actual displaced triangles. Analytic wave peaks between vertices
// can otherwise put the mouth a few centimetres on the wrong side of the visible water.
export function oceanSurface(x,z,t){
 const q=Math.max(0,Math.min(nz-.00001,(z-startZ)/dz)),j=Math.floor(q),v=q-j;
 const d=x-coastRows[j]*(1-v)-coastRows[j+1]*v;
 const i=Math.max(0,Math.min(nx-1,Math.floor(nx*Math.pow(Math.max(0,(d+7)/1900),1/1.65))));
 const u=Math.max(0,Math.min(1,(d-ranges[i])/(ranges[i+1]-ranges[i])));
 const h=(r,k)=>wave(coastRows[r]+ranges[k],startZ+r*dz,t)*amplitudes[k];
 const br=h(j,i+1),tl=h(j+1,i);
 return u+v<=1?h(j,i)*(1-u-v)+br*u+tl*v:h(j+1,i+1)*(u+v-1)+tl*(1-u)+br*(1-v);
}
export function ocean(scene){
 const positions=[],uv=[],indices=[];
 for(let j=0;j<=nz;j++){
  const z=startZ+dz*j;
  for(let i=0;i<=nx;i++){
   const d=ranges[i];
   positions.push(coastRows[j]+d,0,z);uv.push(d,z);
   if(i&&j){const n=j*(nx+1)+i;indices.push(n-1,n,n-nx-1,n-1,n-nx-1,n-nx-2);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(positions,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(indices);
 const uniforms={uTime:{value:0},night:{value:0},glow:{value:0},
  burst:{value:Array.from({length:3},()=>new T.Color(0))},
  lightSite:{value:Array.from({length:3},()=>new T.Vector2())},
  wake:{value:new T.Vector3()},speed:{value:0},turn:{value:0}};
 const swell=spectrum.map(([a,kx,kz,s,p])=>"q=sin(dot(w.xz,vec2("+kx+","+kz+"))+uTime*"+s+"+"+p+");wave+="+a+"*(q+.17*(2.*q*q-1.));").join("\n");
 const normals=spectrum.map(([a,kx,kz,s,p])=>"phase=dot(w.xz,vec2("+kx+","+kz+"))+uTime*"+s+"+"+p+";slope+=vec2("+kx+","+kz+")*"+a+"*cos(phase)*(1.+.68*sin(phase));").join("\n");
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`
 varying vec3 w; varying float depth; uniform float uTime;
 void main(){w=position;depth=uv.x;
 float wave=0.,q=0.;
 ${swell}
 w.y=wave*smoothstep(-5.,10.,depth);gl_Position=projectionMatrix*modelViewMatrix*vec4(w,1.);}
 `,fragmentShader:`
 varying vec3 w; varying float depth; uniform float uTime,night,glow,speed,turn;
 uniform vec3 burst[3],wake; uniform vec2 lightSite[3];
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float rip(vec2 p){float limit=1.-smoothstep(38.,320.,length(cameraPosition.xz-w.xz));
 vec2 warp=vec2(noise2(p*.069+uTime*.045),noise2(p*.087-uTime*.036))*2.3;
 return .63*noise2(p*.65+warp+vec2(uTime*.38,0.))+.24*noise2(p*1.82-warp+vec2(0.,uTime*.55))+limit*.13*noise2(p*4.1+warp*2.);}

 void main(){
 vec2 p=w.xz;float fine=rip(p);float r=(fine-.5)*5.;
 vec2 slope=vec2(0.);float phase;
 ${normals}
 vec3 geometric=normalize(vec3(-slope.x,1.,-slope.y));
 vec2 slopes=vec2(rip(p+vec2(.22,0.))-fine,rip(p+vec2(0.,.22))-fine);
 vec3 normal=normalize(geometric+vec3(slopes.x*.51,0.,slopes.y*.51));
 vec3 eye=normalize(cameraPosition-w);float fres=pow(1.-max(dot(eye,normal),0.),3.);
 float sand=noise2(p*.45+vec2(r*1.3,.2))* .12;
 vec3 base=mix(vec3(.16+sand,.36+sand,.30+sand),mix(vec3(.016,.185,.214),vec3(.012,.095,.165),smoothstep(16.,150.,depth)),smoothstep(0.,21.,depth));
 vec3 reflected=reflect(-eye,normal);vec3 skyColor=mix(vec3(.52,.67,.76),vec3(.14,.38,.56),clamp(reflected.y*1.6,0.,1.));
 base=mix(base,skyColor,.12+fres*.84);
 vec2 dir=vec2(sin(wake.z),cos(wake.z)),across=vec2(dir.y,-dir.x),dp=p-wake.xy;
 vec2 hullP=vec2(dot(dp,across)/6.89,dot(dp,dir)/24.57);
 vec2 rr=reflect(-eye,normal).xz;vec2 rp=dp+rr*(3.7/max(.14,abs(reflected.y)));
 float hullMirror=1.-smoothstep(.82,1.14,length(vec2(dot(rp,across)/4.95,dot(rp,dir)/16.7)));
 base=mix(base,vec3(.026,.081,.099),hullMirror*(.38+.26*fres));
 base*=.76+.24*smoothstep(.8,1.37,length(hullP));
 base=mix(base,mix(vec3(.003,.016,.027),vec3(.023,.05,.085),fres),night);
 float align=max(dot(reflect(-normalize(vec3(.56,.32,-.6)),normal),eye),0.);
 float spec=pow(align,180.)*1.8+pow(align,22.)*.13;
 base+=mix(vec3(1.,.85,.51),vec3(.48,.70,.89),night)*spec;
 float front=depth+2.9*sin(uTime*.89+p.y*.038+2.*noise2(p*.026))+.82*r;
 if(front< -2.)discard;
 float lace=noise2(p*1.42+vec2(uTime*.6,-uTime*.25))*.6+noise2(p*.46+r*.3)*.4;
 float foam=(1.-smoothstep(.15,3.6,abs(front-.35)))*smoothstep(.23,.58,lace);
 foam+=.38*(1.-smoothstep(.2,1.25,abs(front-4.-r)))*smoothstep(.32,.62,lace);
 foam+=.14*smoothstep(.59,.82,w.y)*smoothstep(.62,.73,lace);
 if(glow>.5){
  vec2 toWater=w.xz-cameraPosition.xz;
  float glints=pow(clamp(.50+.28*r,0.,1.),3.)*.90;
  for(int i=0;i<3;i++){
   vec2 ray=lightSite[i]-cameraPosition.xz;
   float u=clamp(dot(toWater,ray)/max(1.,dot(ray,ray)),0.,1.);
   float streak=exp(-length(toWater-u*ray)/mix(3.,32.,u));
   base+=burst[i]*streak*glints*smoothstep(4.,25.,length(toWater));
  }
 }
 float lateral=dot(dp,across),fore=dot(dp,dir)*(speed<0.?-1.:1.);
 float back=(speed<0.?22.8:26.)-fore;
 float shoulder=(speed<0.?4.35:.35)+min(1.,max(back,0.)/15.)*(speed<0.?2.:5.95);
 float edge=abs(abs(lateral)-shoulder),chop=noise2(p*1.12+vec2(uTime*.41,-uTime*.25));
 float bow=exp(-edge*(1.0-.28*abs(speed)))*smoothstep(-.8,1.2,back)*(1.-smoothstep(17.,29.,back));
 float hullFoam=.38*exp(-abs(abs(lateral)-6.22)*1.6)*smoothstep(14.,23.,back)*(1.-smoothstep(40.,49.,back));
 float wakeLine=(bow+hullFoam)*abs(speed)*(.54+.59*chop)*(1.+.35*turn*sign(lateral));
 base=mix(base,mix(vec3(.85,.97,.94),vec3(.39,.57,.65),night),clamp(foam+wakeLine,0.,.9));
 float offshore=smoothstep(1.,100.,depth);
 float transmission=mix(.25,.73,offshore)+.20*fres;
 float alpha=mix(transmission,.94,clamp(foam+wakeLine,0.,1.));
 gl_FragColor=vec4(base,alpha);
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;scene.add(mesh);return uniforms;
}
export function skyDome(scene){
 const uniforms={night:{value:0}};
 const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,vertexShader:`varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 dir;uniform float night;
 void main(){vec3 d=normalize(dir);float h=max(d.y,0.);
 vec3 day=mix(vec3(.78,.88,.93),vec3(.12,.46,.80),pow(h,.55));
 vec3 dark=mix(vec3(.026,.039,.067),vec3(.0018,.0045,.018),pow(h,.46));
 float sun=dot(d,normalize(vec3(.56,.32,-.60)));vec3 c=mix(day,dark,night);
 c+=mix(vec3(1.,.78,.39),vec3(.64,.76,.87),night)*(smoothstep(.9996,.99995,sun)+.17*pow(max(sun,0.),130.));
 vec2 st=floor(d.xz/(h+.08)*280.);float star=fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453);
 c+=night*step(.997,star)*smoothstep(.03,.32,h)*.45;gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(3000,40,24),mat);sky.renderOrder=-20;scene.add(sky);return {sky,uniforms};
}
