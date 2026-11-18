// One draw per active fountain. Rings lie on the landing surface; airborne
// drops face the camera and follow short, independent ballistic arcs.
export function fountainImpact(T,parent,sites){
  const vertices=[],origins=[],seeds=[],indices=[];
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(const [i,[x,y,z,size=1]] of sites.entries()){
    for(let j=0;j<12;j++){
      const angle=(i*.381966+j*.618034)*Math.PI*2;
      const seed=(i*.3457+j*.7321)%1;
      const first=vertices.length/3;
      for(const [u,v] of corners){
        vertices.push(u,v,0);origins.push(x,y,z,size);
        seeds.push(Math.cos(angle),Math.sin(angle),seed,j<2?j-2:j);
      }
      indices.push(first,first+1,first+2,first,first+2,first+3);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("impact",new T.Float32BufferAttribute(origins,4));
  geometry.setAttribute("seed",new T.Float32BufferAttribute(seeds,4));
  geometry.setIndex(indices);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    uniforms:{seconds:{value:0},pressure:{value:1},night:{value:0}},
    vertexShader:`
      attribute vec4 impact,seed;
      uniform float seconds,pressure;
      varying vec2 shape; varying float age,ring;
      void main(){
        ring=step(seed.w,-.5);shape=position.xy;
        float size=impact.w*pressure;
        age=fract(seconds*mix(1.45+seed.z,.92,ring)+seed.z);
        vec3 p=impact.xyz;
        vec4 view;
        if(ring>.5){
          p.xz+=shape*size*(.04+age*.49);
          p.y+=.012;
          view=modelViewMatrix*vec4(p,1.);
        }else{
          p.xz+=seed.xy*size*(.035+age*(.16+.32*seed.z));
          p.y+=4.*age*(1.-age)*size*(.10+.24*seed.z);
          view=modelViewMatrix*vec4(p,1.);
          view.xy+=shape*vec2(.016+.013*seed.z,.02+.024*abs(1.-2.*age))*size;
        }
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float night;
      varying vec2 shape; varying float age,ring;
      void main(){
        float r=length(shape);
        float fade;
        if(ring>.5){
          float radius=.78+.018*sin(atan(shape.y,shape.x)*7.+age*6.);
          fade=(1.-smoothstep(.027,.115,abs(r-radius)))*.57;
        }else fade=(1.-smoothstep(.38,1.,r))*.92;
        float alpha=fade*smoothstep(0.,.12,age)*(1.-smoothstep(.45,1.,age));
        if(alpha<.015)discard;
        gl_FragColor=vec4(mix(vec3(.82,.96,1.),vec3(.36,.60,.78),night),alpha);
        #include <colorspace_fragment>
      }`});
  const mesh=new T.Mesh(geometry,material);mesh.name="분수 물보라와 파문";mesh.frustumCulled=false;
  mesh.userData.dynamic=true;parent.add(mesh);
  return {mesh,update(seconds,night,pressure=1){
    material.uniforms.seconds.value=seconds%3600;material.uniforms.night.value=night;material.uniforms.pressure.value=pressure;
  }};
}
