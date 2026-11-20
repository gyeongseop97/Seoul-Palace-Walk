import * as T from "three";
import {shore,spectrum} from "./pohang-layout.js";
export function ocean(scene){
 const positions=[],uv=[],indices=[];
 const nx=140,nz=350;
 for(let j=0;j<=nz;j++){
  const z=-1650+3000*j/nz;
  for(let i=0;i<=nx;i++){
   const d=-7+Math.pow(i/nx,1.65)*1900;
   positions.push(shore(z)+d,0,z);uv.push(d,z);
   if(i&&j){const n=j*(nx+1)+i;indices.push(n-1,n,n-nx-1,n-1,n-nx-1,n-nx-2);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(positions,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(indices);
 const uniforms={uTime:{value:0},night:{value:0},burst:{value:new T.Color(0)},lightX:{value:280},lightZ:{value:-170},wake:{value:new T.Vector3()},speed:{value:0}};
 const swell=spectrum.map(([a,kx,kz,s,p])=>"q=sin(dot(w.xz,vec2("+kx+","+kz+"))+uTime*"+s+"+"+p+");wave+="+a+"*(q+.17*(2.*q*q-1.));").join("\n");
 const normals=spectrum.map(([a,kx,kz,s,p])=>"phase=dot(w.xz,vec2("+kx+","+kz+"))+uTime*"+s+"+"+p+";slope+=vec2("+kx+","+kz+")*"+a+"*cos(phase)*(1.+.68*sin(phase));").join("\n");
 const material=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexShader:`
 varying vec3 w; varying float depth; uniform float uTime;
 void main(){w=position;depth=uv.x;
 float wave=0.,q=0.;
 ${swell}
 w.y=wave*smoothstep(-5.,10.,depth);gl_Position=projectionMatrix*modelViewMatrix*vec4(w,1.);}
 `,fragmentShader:`
 varying vec3 w; varying float depth; uniform float uTime,night,lightX,lightZ,speed; uniform vec3 burst,wake;
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
 vec2 hullP=vec2(dot(dp,across)/5.1,dot(dp,dir)/18.2);
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
 float streak=exp(-abs(w.z-mix(cameraPosition.z,lightZ,clamp((w.x-cameraPosition.x)/max(5.,lightX-cameraPosition.x),0.,1.)))*.048);
 base+=burst*streak*pow(clamp(.50+.28*r,0.,1.),3.)*.92;
 vec2 axis=vec2(sin(wake.z),cos(wake.z)),v=p-wake.xy;float behind=-dot(v,axis);
 float wakeLine=exp(-abs(abs(dot(v,vec2(axis.y,-axis.x)))-(.17*behind+3.1))*.9)*step(0.,behind)*exp(-max(behind,0.)*.024)*speed;
 base=mix(base,mix(vec3(.85,.97,.94),vec3(.39,.57,.65),night),clamp(foam+wakeLine,0.,.9));
 gl_FragColor=vec4(base,1.);
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
