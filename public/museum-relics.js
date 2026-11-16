// Display enlargements based on the holding museums' views and catalogue descriptions.
function sculpt(T,group){
  const spheres=[new T.SphereGeometry(1,8,5),new T.SphereGeometry(1,12,8),new T.SphereGeometry(1,18,12)];
  const box=new T.BoxGeometry(1,1,1);
  const colors=new Map();
  function finish(color,metalness=.42,roughness=.48,wear=.12){
    const key=[color,metalness,roughness,wear].join(":");
    if(!colors.has(key)){
      const material=new T.MeshStandardMaterial({color,metalness,roughness,vertexColors:true,
        emissive:color,emissiveIntensity:.16});
      material.userData.wear=wear;colors.set(key,material);
    }
    return colors.get(key);
  }
  function mesh(geometry,material,x=0,y=0,z=0){
    const object=new T.Mesh(geometry,material);object.position.set(x,y,z);group.add(object);return object;
  }
  function form(material,x,y,z,w,h,d){
    const size=Math.max(w,h,d),geometry=spheres[size<=.015?0:size<=.045?1:2];
    const object=mesh(geometry,material,x,y,z);object.scale.set(w,h,d);return object;
  }
  function slab(material,x,y,z,w,h,d){
    const object=mesh(box,material,x,y,z);object.scale.set(w,h,d);return object;
  }
  function round(material,profile,x=0,y=0,z=0,sides=36){
    const line=new T.SplineCurve(profile.map(([r,h])=>new T.Vector2(r,h)));
    return mesh(new T.LatheGeometry(line.getPoints(profile.length*3).map(v=>new T.Vector2(Math.max(0,v.x),v.y)),sides),material,x,y,z);
  }
  function path(material,points,thickness=.006,segments=Math.max(6,points.length*2),sides=6){
    const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
    return mesh(new T.TubeGeometry(curve,segments,thickness,sides,false),material);
  }
  function plate(material,shape,depth=.008){
    return mesh(new T.ExtrudeGeometry(shape,{depth,bevelThickness:.0026,bevelSize:.0024,bevelSegments:1,steps:1,curveSegments:7}),material);
  }
  function ring(material,x,y,z,radius,width=.003){
    return mesh(new T.TorusGeometry(radius,width,5,12),material,x,y,z);
  }
  function flesh(material,profiles,segments=32,rings=28,shape){
    const positions=[],indices=[];
    const curve=new T.CatmullRomCurve3(profiles.map(([x,y,z])=>new T.Vector3(x,y,z)));
    const radii=new T.SplineCurve(profiles.map(([, , ,w,d])=>new T.Vector2(w,d)));
    const forward=new T.Vector3(0,0,1),axis=new T.Vector3(),cross=new T.Vector3();
    for(let row=0;row<=rings;row++){
      const t=row/rings,center=curve.getPoint(t),tangent=curve.getTangent(t),r=radii.getPoint(t);
      axis.copy(forward).addScaledVector(tangent,-tangent.z).normalize();
      cross.crossVectors(tangent,axis).normalize();
      for(let column=0;column<=segments;column++){
        const theta=2*Math.PI*column/segments,relief=shape?.(theta,t)??1;
        const p=center.clone().addScaledVector(axis,Math.cos(theta)*r.y*relief)
          .addScaledVector(cross,Math.sin(theta)*r.x*relief);
        positions.push(p.x,p.y,p.z);
        if(row&&column){
          const d=row*(segments+1)+column,a=d-segments-2,b=a+1,c=d-1;
          indices.push(a,b,c,b,d,c);
        }
      }
    }
    const geometry=new T.BufferGeometry().setIndex(indices);
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
    const n=geometry.attributes.normal,m=new T.Vector3(),end=new T.Vector3();
    for(let row=0;row<=rings;row++){
      const i=row*(segments+1),j=i+segments;
      m.fromBufferAttribute(n,i).add(end.fromBufferAttribute(n,j)).normalize();
      n.setXYZ(i,m.x,m.y,m.z);n.setXYZ(j,m.x,m.y,m.z);
    }
    return mesh(geometry,material);
  }
  function merge(){
    // Batch each material's parts into one static draw call and give them consistent surface wear.
    group.updateMatrixWorld(true);
    const batches=new Map();
    for(const object of group.children){
      if(!batches.has(object.material))batches.set(object.material,[]);
      batches.get(object.material).push(object);
    }
    const temporary=new T.Vector3(),direction=new T.Vector3(),matrix=new T.Matrix3();
    for(const [material,parts] of batches){
      const positions=[],normals=[],colors=[],indices=[],wear=material.userData.wear;
      for(const part of parts){
        const offset=positions.length/3,geo=part.geometry,{position,normal}=geo.attributes;
        matrix.getNormalMatrix(part.matrix);
        for(let i=0;i<position.count;i++){
          temporary.fromBufferAttribute(position,i).applyMatrix4(part.matrix);
          const {x,y,z}=temporary;
          positions.push(x,y,z);
          direction.fromBufferAttribute(normal,i).applyNormalMatrix(matrix);
          normals.push(direction.x,direction.y,direction.z);
          const patch=Math.sin(x*75+y*34+z*43)*Math.sin(y*62-z*17+x*25)*.54+
            Math.sin(x*213-y*107+z*159)*.22+Math.sin(x*351+y*265-z*307)*.19;
          const tone=.97+patch*wear;
          colors.push(tone+.012*patch,tone-.033*patch,tone-.056*patch);
        }
        const count=geo.index?.count??position.count;
        for(let i=0;i<count;i++)indices.push(offset+(geo.index?geo.index.getX(i):i));
      }
      const geometry=new T.BufferGeometry().setIndex(indices);
      geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
      geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
      geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();
      group.remove(...parts);group.add(new T.Mesh(geometry,material));
    }
    for(const geometry of new Set([...batches.values()].flat().map(part=>part.geometry)))geometry.dispose();
  }
  return {finish,mesh,form,slab,round,path,plate,ring,flesh,merge};
}

// 덕수3312, former National Treasure no. 83. The three low crown lobes, crossed
// right leg and fingertips at the cheek distinguish this figure from 본관2789.
function pensive(T,a){
  const bronze=a.finish(0x957149,.40,.54,.49),edge=a.finish(0xad8554,.44,.49,.40),crease=a.finish(0x735532,.32,.62,.33);
  a.flesh(bronze,[[0,.009,-.015,.184,.12],[0,.039,-.018,.185,.123],[-.018,.142,-.007,.152,.096],
    [-.033,.299,-.019,.137,.102],[-.039,.410,-.028,.151,.121],[-.037,.488,-.039,.131,.113],[-.020,.505,-.043,.074,.066]],
  42,32,(angle,t)=>1+(.07*Math.sin(angle*10+t*5)+.043*Math.cos(angle*16-t*4))*(.40+.60*Math.sin(t*Math.PI)));
  for(let i=0;i<7;i++){
    const angle=(i-3)*.31,r=Math.sin(angle),f=Math.cos(angle);
    a.path(i%3?bronze:edge,[[.155*r,.044,.104*f],[-.02+.137*r,.13,.105*f],[-.03+.129*r,.27,.095*f],
      [-.032+.134*r,.385,.115*f],[-.024+.138*r,.456,.106*f]],.004+i%3*.0012);
  }
  a.flesh(bronze,[[.137,.032,.102,.042,.046],[.129,.095,.098,.047,.039],[.131,.204,.095,.050,.049],
    [.132,.324,.095,.062,.061],[.126,.385,.096,.067,.069],[.101,.420,.060,.063,.063]],27,22);
  a.form(edge,.143,.021,.139,.073,.020,.103);
  a.form(bronze,.142,.053,.152,.041,.024,.061);
  for(let i=0;i<5;i++)a.form(edge,.116+i*.011,.043,.198-i*.003,.008,.007,.019-i*.001);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    a.form(edge,.143+Math.cos(angle)*.061,.019,.139+Math.sin(angle)*.077,.016,.008,.024).rotation.y=-angle;
  }
  a.flesh(bronze,[[-.196,.492,.070,.002,.003],[-.169,.485,.095,.059,.062],[-.107,.461,.107,.062,.062],
    [-.036,.438,.131,.060,.056],[.067,.420,.144,.046,.042],[.133,.402,.132,.033,.030],[.177,.381,.125,.022,.023]],32,26);
  a.form(bronze,.190,.375,.128,.043,.018,.030).rotation.z=-.35;
  for(let i=0;i<5;i++)a.form(edge,.218-i*.004,.366+i*.004,.111+i*.008,.010,.007,.009);
  for(let i=0;i<5;i++){
    const d=i*.011;
    a.path(i===2?crease:edge,[[-.182,.466-d,.099],[-.143,.433-d,.151],[-.022,.402-d,.174],
      [.073,.408-d*.7,.172],[.132,.421-d*.30,.141]],.0042);
  }
  for(let i=0;i<5;i++){
    const x=-.164+i*.056;
    a.path(edge,[[x-.020,.402,.111],[x,.386,.125],[x+.016,.372-i*.012,.131],[x+.023,.380-i*.013,.110]],.0071);
  }
  a.flesh(bronze,[[.003,.453,-.021,.092,.062],[.009,.542,-.017,.083,.059],[.012,.608,-.013,.084,.061],
    [.010,.678,-.011,.112,.074],[.004,.747,-.012,.130,.075],[.002,.778,-.018,.115,.066],
    [.012,.811,-.020,.072,.058],[.018,.842,-.019,.044,.042],[.020,.876,-.021,.039,.039]],40,38);
  a.flesh(bronze,[[-.088,.768,-.008,.033,.032],[-.125,.753,.017,.039,.040],[-.146,.690,.035,.031,.034],
    [-.155,.617,.052,.028,.030],[-.156,.550,.068,.030,.032],[-.146,.540,.098,.031,.030],
    [-.106,.597,.133,.028,.028],[-.065,.677,.141,.025,.024],[-.047,.751,.137,.018,.018],[-.054,.793,.118,.016,.014]],28,32);
  a.form(bronze,-.050,.800,.114,.021,.039,.012).rotation.z=.18;
  a.path(edge,[[-.064,.809,.117],[-.057,.848,.106],[-.026,.880,.063]],.006);
  a.path(bronze,[[-.053,.815,.113],[-.054,.848,.099],[-.033,.872,.066]],.005);
  a.path(bronze,[[-.075,.799,.119],[-.064,.833,.117],[-.045,.850,.101]],.005);
  a.flesh(bronze,[[.096,.762,-.010,.034,.038],[.126,.740,.016,.034,.036],[.140,.665,.030,.029,.031],
    [.155,.595,.042,.025,.029],[.157,.524,.079,.027,.031],[.136,.460,.132,.030,.031],[.108,.437,.155,.022,.020]],28,28);
  a.form(bronze,.094,.428,.156,.024,.031,.015).rotation.z=.67;
  for(let i=0;i<4;i++)a.path(bronze,[[.103-i*.006,.440-i*.006,.159],[.088-i*.006,.418-i*.007,.168],
    [.069-i*.007,.408-i*.005,.162]],.0048);
  for(const d of [0,.012])a.path(edge,[[-.057,.805-d,-.007],[-.041,.766-d,.028],[-.018,.748-d,.051],
    [.022,.742-d,.058],[.057,.759-d,.043],[.077,.793-d,.008]],.003);
  a.flesh(bronze,[[.020,.846,.014,.018,.021],[.026,.867,.015,.047,.047],[.028,.900,.006,.061,.057],
    [.029,.947,-.002,.068,.060],[.029,.987,-.007,.073,.061],[.030,1.015,-.012,.062,.057],[.032,1.034,-.014,.031,.034]],38,32);
  for(const sign of [-1,1]){
    const x=.028+sign*.066;
    a.form(bronze,x,.920,-.002,.010,.052,.017).rotation.z=sign*.075;
    a.path(crease,[[x,.943,.012],[x+sign*.004,.924,.013],[x,.905,.010]],.0021);
    a.path(edge,[[.028+sign*.011,.956,.057],[.028+sign*.031,.966,.055],[.028+sign*.054,.955,.042]],.0034);
    a.path(crease,[[.028+sign*.012,.943,.058],[.028+sign*.030,.938,.056],[.028+sign*.048,.941,.047]],.0021);
    a.form(edge,.028+sign*.036,.919,.048,.019,.014,.008);
  }
  a.form(edge,.028,.923,.059,.010,.028,.012).rotation.x=.20;
  a.form(bronze,.029,.904,.067,.017,.011,.010);
  a.path(crease,[[.009,.886,.058],[.021,.881,.064],[.033,.881,.065],[.049,.890,.057]],.0022);
  a.path(edge,[[.012,.884,.061],[.025,.875,.066],[.037,.876,.066],[.048,.887,.059]],.0027);
  const positions=[],indices=[];
  for(let row=0;row<=5;row++)for(let i=0;i<=64;i++){
    const t=row/5,angle=i*Math.PI/32,lobe=.5+.5*Math.cos(angle*3),r=.055+.029*t;
    positions.push(.03+r*Math.sin(angle),1.015+.043*t+(.038*lobe-.006*Math.sin(angle))*t*t,-.016+r*.83*Math.cos(angle));
    if(row&&i){const d=row*65+i;indices.push(d-66,d-65,d-1,d-65,d,d-1);}
  }
  const crown=new T.BufferGeometry().setIndex(indices);
  crown.setAttribute("position",new T.Float32BufferAttribute(positions,3));crown.computeVertexNormals();
  const cap=a.finish(0xab7e4e,.49,.46,.40);cap.side=T.DoubleSide;
  a.mesh(crown,cap);
  const rim=Array.from({length:33},(_,i)=>{
    const angle=i*Math.PI/16;
    return [.03+.084*Math.sin(angle),1.058+.038*(.5+.5*Math.cos(angle*3))-.006*Math.sin(angle),-.016+.0697*Math.cos(angle)];
  });
  a.path(edge,rim,.003,72);
}

function crescentShape(T){
  const s=new T.Shape();
  s.moveTo(-.008,.030);s.bezierCurveTo(.019,.041,.047,.021,.039,-.008);
  s.bezierCurveTo(.030,-.037,.004,-.033,-.016,-.019);
  s.bezierCurveTo(.003,-.026,.016,-.007,.009,.009);
  s.bezierCurveTo(.005,.025,-.017,.018,-.008,.030);return s;
}

// 황북 1. Three tree uprights, paired antlers, jade commas and six chains.
function goldCrown(T,a){
  const gold=a.finish(0xe1ae45,.69,.32,.18),dark=a.finish(0xa57525,.57,.40,.20),bright=a.finish(0xf3cc60,.65,.31,.12);
  const jade=a.finish(0x46735b,.17,.31,.19),mount=a.finish(0x3a3040,0,.97,0);
  const bandY=.425,radius=.184;
  a.round(mount,[[0,.005],[.103,.005],[.110,.027],[.111,.389],[.143,.398],[0,.404]],0,0,0,32);
  a.round(gold,[[.171,.402],[.182,.407],[.189,.416],[.192,.467],[.188,.480],[.175,.480],[.171,.472],[.168,.417],[.171,.402]]);
  for(const y of [.416,.469])a.path(bright,Array.from({length:49},(_,i)=>{
    const angle=i*Math.PI/24;return [Math.sin(angle)*.192,y+Math.sin(angle*18)*.002,Math.cos(angle)*.192];
  }),.004,96);
  function leaf(material,x,y,z,angle,size=.028){
    const object=a.form(material,x,y,z,size,size*.87,.0037);
    object.rotation.set(.18,angle,.20);return object;
  }
  function ornament(angle,x,y,curve=false){
    const r=radius+.016,z=r*Math.cos(angle),cx=r*Math.sin(angle);
    const px=cx+Math.cos(angle)*x,pz=z-Math.sin(angle)*x;
    a.ring(dark,px,y+.013,pz,.009,.002).rotation.y=angle;
    if(curve){
      const shape=a.plate(jade,crescentShape(T),.006);
      shape.position.set(px,y-.014,pz+.008);shape.scale.setScalar(.43);
      shape.rotation.set(.13,angle,-.39);
    }else leaf(bright,px,y-.007,pz+.014,angle,.016);
  }
  for(let i=0;i<40;i++){
    const angle=i*Math.PI/20;
    for(const y of [bandY-.010,bandY+.043]){
      a.form(bright,Math.sin(angle)*.194,y,Math.cos(angle)*.194,.004,.004,.004);
    }
    if(i%4===0)ornament(angle,0,bandY+.023,i%8===0);
  }
  function strip(angle,profile){
    const outline=new T.Shape(profile.map(([x,y])=>new T.Vector2(x,y)));
    const panel=a.plate(gold,outline,.004);
    panel.position.set(radius*Math.sin(angle),0,radius*Math.cos(angle));panel.rotation.y=angle;
    return panel;
  }
  for(const [angle,top,lean] of [[0,.894,0],[-.73,.859,-.079],[.73,.859,.079]]){
    strip(angle,[[-.016,.454],[.016,.454],[lean+.016,top-.058],[lean+.032,top-.038],[lean+.021,top-.016],
      [lean,top],[lean-.021,top-.016],[lean-.031,top-.040],[lean-.016,top-.058]]);
    for(let tier=0;tier<3;tier++){
      const y=.548+tier*.114,c=lean*(y-.454)/(top-.454),width=.066-tier*.008;
      for(const sign of [-1,1]){
        strip(angle,[[c,y-.018],[c+sign*(width-.023),y-.018],[c+sign*width,y+.005],
          [c+sign*(width+.006),y+.048],[c+sign*(width-.002),y+.063],
          [c+sign*(width-.019),y+.045],[c+sign*(width-.023),y+.008],[c,y+.005]]);
        ornament(angle,c+sign*.027,y+.011,tier===1);ornament(angle,c+sign*(width-.013),y+.037,tier!==1);
      }
      ornament(angle,c,y-.008,tier%2===0);
    }
  }
  for(const sign of [-1,1]){
    const angle=sign*1.39;
    strip(angle,[[0,.452],[sign*.025,.455],[sign*.108,.824],[sign*.128,.893],[sign*.112,.901],
      [sign*.086,.840],[sign*.057,.720],[sign*.027,.616]]);
    for(let tier=0;tier<4;tier++){
      const x=sign*(.029+tier*.025),y=.541+tier*.082;
      strip(angle,[[x,y],[x-sign*.031,y+.017],[x-sign*.061,y+.058],[x-sign*.047,y+.073],
        [x-sign*.027,y+.041],[x+sign*.008,y+.021]]);
      ornament(angle,x,y+.028,tier%2===0);ornament(angle,x-sign*.045,y+.059,tier%2===1);
    }
    for(let strand=0;strand<3;strand++){
      const angle=sign*(.59+strand*.27),depth=[.369,.293,.227][strand],r=.204;
      const x=r*Math.sin(angle),z=r*Math.cos(angle),links=Math.round(depth/.022);
      const pendant=a.plate(jade,crescentShape(T),.008);
      pendant.position.set(x,.392,z+.008);pendant.scale.setScalar(.68);pendant.rotation.y=angle;
      for(let i=0;i<links;i++){
        const y=.366-i*depth/links;
        a.ring(gold,x+sign*i*.0017,y,z,.012,.0025).rotation.y=angle+(i%2)*1.42;
        if(i%2===0)leaf(i%4?gold:bright,x+sign*i*.0017,y,z+.009,angle,.010);
      }
      leaf(bright,x+sign*links*.0017,.370-depth,z+.012,angle,.020).scale.y*=1.7;
    }
  }
}

function baekjeBurner(T,a){
  const gold=a.finish(0xa47f45,.43,.46,.38),lip=a.finish(0xba9756,.49,.41,.35);
  const dark=a.finish(0x766340,.41,.54,.41),shadow=a.finish(0x4f4932,.24,.68,.27);
  a.round(dark,[[0,.001],[.185,.002],[.208,.012],[.211,.027],[.201,.049],[.173,.058],[0,.061]]);
  for(let i=0;i<17;i++){
    const angle=i*Math.PI*2/17,r=.168;
    a.path(gold,[[Math.sin(angle)*r,.025,Math.cos(angle)*r],[Math.sin(angle+.29)*.201,.036,Math.cos(angle+.29)*.201],
      [Math.sin(angle+.51)*.183,.044,Math.cos(angle+.51)*.183],[Math.sin(angle+.62)*.152,.054,Math.cos(angle+.62)*.152]],.010);
  }
  a.flesh(gold,[[.176,.145,-.031,.004,.004],[.165,.192,.015,.013,.015],[.130,.166,.078,.020,.025],
    [.090,.095,.090,.031,.036],[.008,.083,.074,.046,.043],[-.065,.123,.032,.042,.039],
    [-.069,.201,.009,.032,.034],[-.037,.270,.019,.024,.028],[.001,.319,.005,.022,.019]],24,25);
  for(let i=0;i<14;i++){
    const t=i/13,angle=.25+i*.36;
    a.form(i%3?gold:lip,.096*Math.sin(angle)*(1-t*.63),.113+.174*t,.076*Math.cos(angle),.016,.009,.011).rotation.y=angle;
  }
  a.form(gold,.003,.302,.020,.048,.033,.031).rotation.z=.56;
  a.form(lip,.016,.322,.030,.033,.021,.025).rotation.z=.44;
  a.form(shadow,.037,.309,.038,.014,.006,.013);
  for(const side of [-1,1]){
    a.form(dark,side*.027,.316,.041,.009,.008,.008);
    a.path(lip,[[side*.023,.316,.027],[side*.041,.343,.017],[side*.040,.366,.011]],.0055);
    a.path(gold,[[side*.045,.116,.052],[side*.095,.088,.091],[side*.119,.060,.099],[side*.142,.039,.117]],.015);
    for(let i=0;i<3;i++)a.path(lip,[[side*.116,.068,.103-i*.022],[side*.145,.051,.113-i*.021],
      [side*.155,.039,.121-i*.020]],.0065);
  }
  a.round(gold,[[0,.327],[.038,.327],[.051,.348],[.072,.365],[.106,.390],[.145,.421],[.164,.457],
    [.174,.488],[.175,.518],[.171,.536],[.156,.538],[0,.538]]);
  for(const [y,r] of [[.429,.134],[.465,.163],[.500,.172]])for(let i=0;i<13;i++){
    const angle=(i+y*7)*Math.PI*2/13,x=r*Math.sin(angle),z=r*Math.cos(angle);
    const petal=a.form(gold,x,y,z,.036,.044,.013);petal.rotation.set(.32*Math.cos(angle),angle,.25*Math.sin(angle));
    const mark=(u,v,offset)=>[x+Math.cos(angle)*u+Math.sin(angle)*offset,y+v,z-Math.sin(angle)*u+Math.cos(angle)*offset];
    a.path(lip,[mark(-.022,.011,.009),mark(0,-.024,.014),mark(.022,.011,.009)],.0038);
    a.form(dark,...mark(0,.009,.015),.007,.010,.006);
  }
  for(const y of [.531,.541,.548])a.path(lip,Array.from({length:35},(_,i)=>{
    const t=i*Math.PI/17;return [.174*Math.sin(t),y,.174*Math.cos(t)];
  }),.0033,60);
  a.round(dark,[[0,.546],[.171,.548],[.177,.564],[.164,.606],[.151,.641],[.138,.674],
    [.109,.715],[.093,.745],[.069,.783],[.046,.825],[.025,.866],[0,.880]]);
  // Unequal peaks continue around the lid. Each cast ridge slopes forward and catches the light.
  for(const [tier,count,y,radius,h] of [[0,10,.572,.153,.104],[1,8,.641,.129,.110],[2,6,.707,.103,.106],[3,4,.774,.066,.094]]){
    for(let i=0;i<count;i++){
      const angle=(i+tier*.37)*Math.PI*2/count,w=(.020+(i%3)*.005)*(1-tier*.08);
      const top=h*(1+Math.sin(i*8.3+tier)*.225);
      const radial=(r,v,across=0)=>[r*Math.sin(angle)+Math.cos(angle)*across,v,r*Math.cos(angle)-Math.sin(angle)*across];
      a.flesh(gold,[[...radial(radius,y-.018),w*.62,.008],[...radial(radius+.014,y+.007),w,.024],
        [...radial(radius+.010,y+top*.41),w*.78,.018],[...radial(radius-.004,y+top*.76,w*.19),w*.41,.011],
        [...radial(radius-.013,y+top,w*.35),.002,.004]],12,10);
      a.path(lip,[radial(radius+.010,y-.009,-w*.58),radial(radius+.030,y+.014,0),
        radial(radius+.025,y+top*.50,w*.10),radial(radius-.002,y+top,w*.34)],.0035);
      if((i+tier)%3===0){
        a.form(shadow,...radial(radius+.023,y+top*.32,w*.26),.011,.008,.009);
        a.form(gold,...radial(radius+.032,y+.024,-w*.50),.009,.017,.006);
        a.form(lip,...radial(radius+.034,y+.041,-w*.50),.006,.008,.006);
      }
    }
  }
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5-.3,x=Math.sin(angle)*.060,z=Math.cos(angle)*.060;
    a.form(gold,x,.839,z,.013,.023,.011);a.form(lip,x,.864,z,.009,.011,.008);
    const flute=a.form(lip,x+.012*Math.cos(angle),.843,z+.011*Math.sin(angle),.017,.004,.007);flute.rotation.y=angle;
  }
  a.round(lip,[[0,.868],[.028,.870],[.031,.888],[.023,.896],[.013,.905],[0,.905]]);
  for(const side of [-1,1]){
    a.path(gold,[[side*.011,.889,.009],[side*.023,.904,.019],[side*.016,.928,.026]],.007);
    for(let i=0;i<5;i++){
      const e=i*.008;
      a.path(i%2?gold:lip,[[side*.012,.939+e*.64,.017],[side*(.032+e*.46),.950+e*.65,.006-e*.31],
        [side*(.048+e*.69),.976+e*.75,-.011-e*.54],[side*(.054+e*.66),.994+e*.96,-.025-e*.64]],.0047);
    }
  }
  a.form(gold,0,.935,-.006,.019,.033,.04).rotation.x=-.37;
  a.flesh(lip,[[0,.944,.013,.014,.014],[0,.968,.022,.013,.011],[0,1.000,.023,.012,.010],
    [0,1.025,.034,.011,.012],[0,1.031,.050,.008,.006]],18,16);
  a.form(lip,0,1.022,.066,.009,.007,.016).rotation.x=.28;
  a.form(dark,.012,1.032,.041,.0038,.004,.0038);
  a.form(dark,-.012,1.032,.041,.0038,.004,.0038);
  a.path(lip,[[0,1.033,.031],[.002,1.053,.029],[.007,1.066,.013]],.004);
  for(let i=0;i<4;i++)a.path(gold,[[0,.934,-.028],[(i-1.5)*.014,.957,-.050],
    [(i-1.5)*.022,.990,-.076],[(i-1.5)*.020,1.031,-.083]],.006);
}

function standingBuddha(T,a){
  const bronze=a.finish(0x857249,.39,.54,.44),gold=a.finish(0xb18e4d,.42,.46,.36),patina=a.finish(0x5a6447,.31,.64,.35);
  a.round(bronze,[[0,0],[.168,0],[.183,.021],[.181,.039],[.169,.044],[.164,.084],[.173,.099],
    [.155,.122],[.124,.129],[.123,.160],[.086,.192],[.111,.211],[.097,.255],[.081,.269],[0,.269]],0,0,0,10);
  for(let i=0;i<10;i++){
    const angle=i*Math.PI/5;
    a.form(patina,.167*Math.sin(angle),.066,.167*Math.cos(angle),.032,.015,.007).rotation.y=angle;
    a.form(gold,.096*Math.sin(angle),.190,.096*Math.cos(angle),.022,.020,.017).rotation.z=Math.cos(angle)*.45;
    a.form(gold,.089*Math.sin(angle+.17),.230,.089*Math.cos(angle+.17),.022,.018,.013).rotation.y=angle;
  }
  for(const x of [-.035,.035])a.form(gold,x,.275,.043,.025,.019,.049);
  a.flesh(bronze,[[0,.277,-.006,.082,.047],[0,.363,-.006,.084,.045],[0,.460,0,.093,.049],
    [0,.564,0,.102,.060],[0,.666,-.008,.104,.053],[0,.749,-.011,.087,.053],[0,.795,-.008,.049,.041]],36,27,
    (angle,t)=>1+.035*Math.sin(angle*13+t*6));
  for(let i=0;i<9;i++){
    const t=i/8,w=.072+i*.002,h=.355+t*.382;
    a.path(i%3===2?patina:gold,[[-w,h+.041,.030],[-w*.66,h-.003,.053],[0,h-.035-i*.001,.058],
      [w*.65,h-.010,.053],[w,h+.032,.035]],.0051);
  }
  for(const side of [-1,1]){
    const isRaised=side<0;
    a.flesh(bronze,[[side*.056,.743,-.014,.030,.029],[side*.083,.710,-.005,.021,.024],[side*.091,.653,.005,.022,.021],
      [side*.095,.597,.027,.020,.021],[side*.099,isRaised?.654:.561,.057,.017,.015]],22,21);
    a.form(gold,side*.098,isRaised?.656:.558,.063,.019,.025,.013);
    for(let i=0;i<4;i++)a.path(gold,[[side*.098+(.010-i*.006),isRaised?.663:.551,.069],
      [side*.098+(.010-i*.006),isRaised?.682:.539,.070]],.0026,6,6);
    a.form(bronze,side*.035,.823,-.002,.008,.023,.013);
    a.path(patina,[[side*.007,.840,.043],[side*.024,.837,.038],[side*.031,.840,.028]],.0024);
    for(let i=0;i<3;i++)a.path(gold,[[side*.082,.704-i*.036,.026],[side*.101,.702-i*.036,.041],[side*.106,.697-i*.036,.029]],.003);
  }
  a.form(gold,0,.837,-.002,.041,.061,.043);
  a.form(patina,0,.881,-.005,.043,.040,.043);
  a.form(gold,0,.827,.040,.008,.012,.007);
  a.path(patina,[[-.011,.815,.034],[0,.812,.040],[.011,.815,.034]],.0019);
  for(let i=0;i<40;i++){
    const angle=i*2.399,h=.862+(i%9)*.005,r=.043-.014*((i%9)/8)**2;
    a.form(i%4?bronze:gold,Math.sin(angle)*r,h,-.004+Math.cos(angle)*r,.006,.006,.006);
  }
}

function goldEarrings(T,a){
  const gold=a.finish(0xd9a94b,.60,.35,.16),bright=a.finish(0xeec566,.67,.30,.15),dark=a.finish(0x8c6c33,.56,.42,.20);
  const cloth=a.finish(0x3d3440,0,.89,0);
  a.slab(cloth,0,.028,.01,.54,.050,.22);
  a.slab(cloth,0,.368,-.12,.041,.67,.039);a.slab(cloth,0,.684,-.11,.386,.025,.040);
  for(const x of [-.132,.132]){
    const hoop=a.ring(gold,x,.617,-.008,.066,.014);hoop.scale.x=.63;hoop.rotation.y=.58;
    a.ring(bright,x,.550,.007,.027,.007);
    a.form(gold,x,.497,.015,.035,.046,.026);
    for(let i=0;i<21;i++){
      const angle=i*2.399,t=i/20;
      a.form(i%5?bright:dark,x+.035*Math.cos(angle)*(1-.27*Math.abs(t-.5)),.456+t*.077,
        .016+.029*Math.sin(angle),.008,.008,.007);
    }
    a.ring(dark,x,.434,.017,.019,.006);
    a.flesh(gold,[[x,.213,.023,.001,.001],[x,.269,.023,.025,.012],[x,.333,.022,.047,.023],
      [x,.381,.022,.045,.023],[x,.411,.022,.019,.015],[x,.421,.022,.003,.004]],24,24);
    for(const side of [-1,1]){
      const r=side*.039;
      a.path(bright,[[x,.216,.025],[x+r*.65,.282,.035],[x+r,.343,.043],[x+r*.79,.387,.045],[x,.413,.037]],.005);
      a.path(dark,[[x,.234,.029],[x+r*.39,.294,.045],[x+r*.59,.349,.051],[x+r*.42,.383,.045],[x,.400,.039]],.003);
      for(let i=0;i<17;i++){
        const t=i/16;
        a.form(bright,x+Math.sin(t*Math.PI*.93)*r,.231+t*.168,.024+Math.sin(t*Math.PI)*.021,.0034,.0031,.0033);
      }
    }
    a.path(cloth,[[x,.679,-.107],[x,.682,-.038],[x,.672,-.013]],.006);
  }
}

function baekjeVessel(T,a){
  const clay=a.finish(0xab9776,.09,.87,.31),trim=a.finish(0x97846a,.04,.79,.27),inside=a.finish(0x766747,.04,.91,.21);
  a.round(clay,[[0,0],[.107,0],[.115,.010],[.136,.038],[.151,.099],[.162,.184],[.170,.261],
    [.178,.353],[.190,.435],[.193,.457],[.196,.471],[.181,.471]],0,0,0,54);
  a.round(inside,[[.181,.471],[.177,.447],[.168,.353],[.158,.270],[.149,.178],[.134,.095],[.113,.053],[.065,.037],[0,.033]],0,0,0,54);
  for(const [y,r] of [[.089,.15],[.163,.161],[.245,.172],[.323,.181],[.409,.188]])for(const offset of [-.009,0,.009]){
    const band=a.ring(trim,0,y+offset,0,r,.0026);band.rotation.x=Math.PI/2;
  }
  for(const side of [-1,1]){
    a.path(clay,[[side*.158,.116,0],[side*.228,.157,0],[side*.264,.224,0],[side*.263,.308,0],
      [side*.238,.364,0],[side*.191,.378,0],[side*.181,.365,0]],.010,32,10);
    a.path(trim,[[side*.169,.241,.001],[side*.223,.237,.003],[side*.265,.245,.003]],.009,10,9);
  }
}

function goryeoMirror(T,a){
  const copper=a.finish(0x537161,.48,.57,.48),ridge=a.finish(0x78917a,.47,.51,.41),tarnish=a.finish(0x3e5c51,.39,.62,.52);
  const stand=a.finish(0x414343,0,.89,0);
  a.slab(stand,0,.026,-.046,.49,.045,.31);a.slab(stand,0,.257,-.058,.090,.47,.037).rotation.x=.12;
  const disc=a.round(copper,[[0,-.014],[.273,-.015],[.304,-.019],[.315,-.012],[.321,0],[.317,.014],
    [.307,.018],[.290,.013],[.278,.010],[0,.007]],0,.36,.022,58);
  disc.rotation.x=Math.PI/2;
  for(const radius of [.115,.216,.242,.275,.303])a.ring(radius===.303?ridge:tarnish,0,.36,.041,radius,.0048);
  a.form(copper,0,.36,.063,.043,.043,.035);
  a.ring(tarnish,0,.36,.092,.019,.007);
  a.form(tarnish,0,.36,.100,.012,.010,.002);
  for(let i=0;i<72;i++){
    const angle=i*Math.PI/36;
    a.form(ridge,.259*Math.cos(angle),.36+.259*Math.sin(angle),.048,.006,.009,.003).rotation.z=angle;
  }
  for(let i=0;i<4;i++){
    const angle=(i+.5)*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
    const radial=(r,t)=>[c*r-s*t,.36+s*r+c*t,.048];
    a.form(ridge,...radial(.147,0),.021,.024,.013);
    a.ring(tarnish,...radial(.146,.006),.029,.004);
    for(let j=0;j<3;j++)a.path(ridge,[radial(.090,.067+j*.007),radial(.132,.050+j*.012),radial(.172,.062+j*.012),
      radial(.205,.026+j*.013)],.0034);
  }
}

function lotusOrnament(T,a){
  const gold=a.finish(0xc8a245,.64,.33,.17),light=a.finish(0xe6c257,.61,.29,.17),dark=a.finish(0x907234,.61,.47,.21);
  const stand=a.finish(0x4b3a47,0,.95,0);
  a.slab(stand,0,.024,-.023,.39,.043,.25);a.slab(stand,0,.254,-.071,.098,.44,.033).rotation.x=.08;
  a.path(gold,Array.from({length:33},(_,i)=>{
    const angle=i*Math.PI/16,r=.204+Math.sin(angle*8)*.0035;
    return [r*Math.cos(angle),.29+r*Math.sin(angle),.003];
  }),.0083,68);
  a.form(gold,.021,.234,.011,.078,.034,.014).rotation.z=.28;
  a.path(light,[[.073,.258,.015],[.113,.285,.021],[.109,.325,.023],[.089,.327,.023]],.010);
  a.form(gold,.088,.328,.023,.018,.017,.012);
  a.form(dark,.084,.333,.033,.004,.004,.0017);
  a.path(light,[[.091,.319,.029],[.063,.315,.020],[.052,.307,.018]],.0048);
  for(let i=0;i<6;i++)a.path(light,[[.012-i*.018,.232,.020],[-.030-i*.016,.248+i*.007,.018],
    [-.056-i*.010,.278+i*.006,.013]],.0054);
  for(let i=0;i<8;i++){
    const theta=i*Math.PI/4,x=Math.cos(theta)*.139,y=.29+Math.sin(theta)*.139;
    const leaf=a.form(i%2?light:gold,x,y,.020,.042,.023,.014);leaf.rotation.z=theta+.55;
    a.path(dark,[[x-.026*Math.cos(theta),y-.026*Math.sin(theta),.029],[x,y,.035],[x+.024*Math.cos(theta),y+.024*Math.sin(theta),.030]],.0031);
  }
  for(const side of [-1,1])a.path(gold,[[side*.15,.150,.014],[side*.093,.177,.020],[side*.065,.213,.021],
    [side*.069,.318,.015],[side*.106,.413,.017]],.0065);
}

function goldBook(T,a){
  const copper=a.finish(0xcbb052,.51,.49,.26),glint=a.finish(0xd4bb65,.48,.43,.22),letter=a.finish(0xae9350,.38,.55,.28);
  const mount=a.finish(0x4d4242,0,.89,0);
  a.slab(mount,0,.024,-.064,.73,.044,.31);
  for(const side of [-1,1]){
    const x=side*.162,y=.310,z=-.019,angle=-.21;
    a.slab(copper,x,y,z,.285,.574,.014).rotation.x=angle;
    a.slab(glint,x,y,z-.010,.279,.566,.009).rotation.x=angle;
    const point=(dx,dy)=>[x+dx,y+dy*Math.cos(angle),z+dy*Math.sin(angle)+.007];
    for(const offset of [-.245,.174])a.form(letter,...point(-side*.127,offset),.0049,.008,.002);
    // Incised strokes remain low-contrast at the mounted display scale.
    for(let column=0;column<5+(side<0);column++)for(let row=0;row<12-(column%4===0);row++){
      const dx=-.103+column*.037,dy=.184-row*.029;
      const stroke=column*7+row*11+Number(side>0);
      if(stroke%3!==1)a.slab(letter,...point(dx,dy),.012+stroke%5*.001,.0019,.0020).rotation.x=angle;
      if(stroke%5!==2)a.slab(letter,...point(dx-.005,dy-.005),.0018,.016,.0020).rotation.x=angle;
      if(stroke%7!==4)a.slab(letter,...point(dx+.004,dy-.012),.012,.0018,.0020).rotation.x=angle;
    }
  }
}

function jadeSeal(T,a){
  const jade=a.finish(0xc8bea1,.11,.38,.34),light=a.finish(0xd7ccb2,.12,.35,.33),shadow=a.finish(0xb0a286,.10,.49,.32);
  const red=a.finish(0x975c56,.07,.61,.40);
  a.slab(red,0,.019,0,.528,.032,.495);
  a.slab(jade,0,.117,0,.528,.190,.495);
  a.slab(light,0,.208,0,.508,.021,.475);
  a.flesh(jade,[[0,.215,-.107,.09,.049],[0,.270,-.117,.117,.070],[0,.338,-.111,.123,.089],
    [0,.417,-.064,.113,.100],[0,.467,-.007,.089,.074],[0,.485,.006,.052,.038]],32,33);
  a.form(light,0,.365,.092,.103,.084,.075);
  a.form(jade,0,.326,.131,.063,.044,.066);
  a.form(shadow,0,.307,.168,.046,.012,.018);
  a.form(light,0,.297,.152,.048,.015,.036);
  for(const side of [-1,1]){
    a.form(shadow,side*.043,.384,.144,.012,.012,.009);
    a.path(light,[[side*.022,.392,.148],[side*.050,.414,.137],[side*.080,.398,.103]],.011);
    a.path(jade,[[side*.055,.407,.122],[side*.077,.459,.081],[side*.061,.479,.035]],.010);
    a.path(light,[[side*.084,.338,.111],[side*.119,.348,.075],[side*.126,.321,.039],[side*.101,.292,.065]],.009);
    a.form(light,side*.076,.251,.100,.025,.027,.054).rotation.z=side*.2;
    for(let i=0;i<4;i++)a.path(shadow,[[side*(.064+i*.009),.244,.141],[side*(.062+i*.009),.226,.159]],.0037);
    for(let i=0;i<6;i++){
      const angle=i*.39;
      a.path(shadow,[[side*(.106-Math.sin(angle)*.023),.289+i*.022,-.153],
        [side*(.132-Math.sin(angle)*.020),.315+i*.019,-.089],[side*(.116-Math.sin(angle)*.019),.284+i*.024,-.034]],.0036);
    }
  }
}

const models={"silla-pensive":pensive,"silla-gold-crown":goldCrown,"silla-baekje-burner":baekjeBurner,
  "silla-buddha":standingBuddha,"early-silla-earring":goldEarrings,"early-baekje-vessel":baekjeVessel,
  "early-goryeo-mirror":goryeoMirror,"early-goryeo-ornament":lotusOrnament,
  "empire-gold-book":goldBook,"empire-jade-seal":jadeSeal};
export function buildMuseumRelic(T,group,id){
  const model=models[id];
  if(!model)return false;
  const workshop=sculpt(T,group);
  model(T,workshop);workshop.merge();return true;
}
