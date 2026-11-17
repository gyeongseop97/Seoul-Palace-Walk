const wallThemes={
  home:{base:"#bdd0c8",shadow:"#799d98",light:"#e3e9da",ink:"#3c716a",accent:"#b18069",repeat:6.4},
  colors:{base:"#c4b9d0",shadow:"#ab9abf",light:"#e4deec",ink:"#836792",accent:"#c58c86",repeat:7.5},
  objects:{base:"#d5b49a",shadow:"#ba9276",light:"#edddbd",ink:"#9c5c46",accent:"#d39866",repeat:6.8},
  weave:{base:"#b7bfa4",shadow:"#899578",light:"#e5dbc1",ink:"#597260",accent:"#aa805a",repeat:5.4},
  tide:{base:"#a3b0b6",shadow:"#6c818f",light:"#cad2d0",ink:"#3d6476",accent:"#b98b56",repeat:7.8},
  wind:{base:"#c7d6d6",shadow:"#8db0b5",light:"#e3e7db",ink:"#53828d",accent:"#a8947e",repeat:9.5},
  hirst:{base:"#334f61",shadow:"#263947",light:"#536d78",ink:"#a3cbc9",accent:"#76a69e",repeat:6.3},
  mueck:{base:"#cbb4a4",shadow:"#ae8f82",light:"#e9d7c3",ink:"#855e58",accent:"#ac7d61",repeat:7.2}
};

function wallpaperTile(id,theme){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=512;
  const ctx=canvas.getContext("2d"),size=canvas.width;
  const wash=ctx.createLinearGradient(0,0,0,size);
  wash.addColorStop(0,theme.light);wash.addColorStop(.55,theme.base);wash.addColorStop(1,theme.shadow);
  ctx.fillStyle=wash;ctx.fillRect(0,0,size,size);
  ctx.lineCap="round";ctx.lineJoin="round";

  function layer(color,alpha,width){
    ctx.fillStyle=ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;
  }
  function line(points){
    ctx.beginPath();ctx.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
    ctx.stroke();
  }
  function arc(x,y,r,from=0,to=Math.PI*2){
    ctx.beginPath();ctx.arc(x,y,r,from,to);ctx.stroke();
  }
  function repeat(draw){for(const offset of [-size,0,size])draw(offset);}

  switch(id){
    case "home":{
      layer(theme.ink,.27,4);
      for(const x of [22,191,354])ctx.strokeRect(x,52,132,375);
      layer(theme.accent,.25,2);
      for(const x of [41,210,373])ctx.strokeRect(x,74,105,332);
      layer(theme.ink,.22,1.7);
      for(const x of [56,225,388]){
        for(let i=0;i<4;i++)line([[x+24*i,119],[x+24*i,389]]);
        for(let i=0;i<8;i++)line([[x,131+35*i],[x+72,131+35*i]]);
      }
      layer(theme.light,.36,1);
      for(let y=5;y<size;y+=5)line([[0,y],[size,y]]);
      break;
    }
    case "colors":{
      const spectrum=["#805c93","#657fb0","#5a9b9a","#d8a767","#c17b92"];
      repeat(offset=>{
        for(const [i,color] of spectrum.entries()){
          layer(color,.18,22);
          line([[offset-72,462],[offset+112+i*43,279],[offset+44+i*53,153],[offset+233+i*59,29]]);
          layer(color,.28,1.8);
          line([[offset+213+i*56,513],[offset+326+i*50,355],[offset+279+i*51,230],[offset+475+i*44,68]]);
        }
        layer(theme.light,.78,2);
        for(const [x,y,radius] of [[63,137,18],[309,287,23],[427,150,32]])arc(offset+x,y,radius);
      });
      break;
    }
    case "objects":{
      layer(theme.ink,.2,2);
      for(const y of [94,205,316,427])line([[0,y],[size,y]]);
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const x=47+col*104,y=181+row*111,w=23+(col*7+row*9)%17,h=27+(row*19+col*11)%42;
        layer((row+col)%3?theme.ink:theme.accent,.28,2);
        ctx.beginPath();ctx.moveTo(x-w,y-h);
        ctx.quadraticCurveTo(x-w*.92,y-6,x-w*.48,y);
        ctx.lineTo(x+w*.48,y);ctx.quadraticCurveTo(x+w*.92,y-6,x+w,y-h);
        ctx.ellipse(x,y-h,w,6,0,0,Math.PI*2);ctx.stroke();
        layer(theme.light,.26,1.2);
        for(let i=1;i<4;i++)line([[x-w*(.9-i*.12),y-h+i*6],[x+w*(.9-i*.12),y-h+i*6]]);
      }
      break;
    }
    case "weave":{
      repeat(offset=>{
        for(let x=offset-16;x<offset+size;x+=32){
          layer(theme.ink,.18,3);
          line([[x,45],[x,456]]);
        }
        for(let j=0;j<15;j++){
          const y=49+j*29,points=[];
          for(let x=0;x<=16;x++)points.push([offset+x*32,y+(x%2?11:-11)]);
          layer(j%3?theme.ink:theme.accent,.34,j%3?1.5:3.8);line(points);
          layer(theme.light,.47,1.15);line(points.map(([x,h])=>[x,h-3.7]));
        }
      });
      break;
    }
    case "tide":{
      repeat(offset=>{
        for(const [i,[x,y,radius]] of [[122,159,104],[365,331,133]].entries()){
          layer(theme.ink,.31,1.7);
          for(const radiusFactor of [.34,.56,.82,1])arc(offset+x,y,radius*radiusFactor);
          for(let tick=0;tick<24;tick++){
            const angle=tick*Math.PI/12,dx=Math.cos(angle),dy=Math.sin(angle),inset=tick%3?6:14;
            line([[offset+x+dx*radius,y+dy*radius],[offset+x+dx*(radius-inset),y+dy*(radius-inset)]]);
          }
          layer(theme.accent,.57,2.7);
          line([[offset+x-radius*.52,y+25],[offset+x+radius*.42,y-(i?67:53)]]);
        }
      });
      layer(theme.ink,.17,1);
      for(const y of [106,160,215,272,328,385])line([[0,y],[size,y]]);
      break;
    }
    case "wind":{
      for(let band=0;band<17;band++){
        const points=[],amplitude=11+(band%4)*6,y=102+band*16;
        for(let x=0;x<=size;x+=8){
          const angle=x/size*Math.PI*2;
          points.push([x,y+Math.cos(angle+band*.22)*amplitude+Math.sin(angle*2+band*.29)*5]);
        }
        layer(band%4===0?theme.light:theme.ink,band%5===0?.28:.17,band%4===0?11:1.5+band%3);
        line(points);
      }
      break;
    }
    case "hirst":{
      layer(theme.ink,.17,1);
      for(let i=0;i<=8;i++)line([[i*64,47],[i*64,465]]);
      for(let y=48;y<465;y+=64)line([[0,y],[size,y]]);
      for(let row=0;row<6;row++)for(let col=0;col<8;col++){
        const x=col*64+32,y=row*64+80,r=(row+col)%3===0?12:6;
        layer((row+col)%2?theme.ink:theme.accent,.36,1.2);
        arc(x,y,r);
        if((row*3+col)%4===0)line([[x-r-6,y],[x,y-r-6],[x+r+6,y],[x,y+r+6],[x-r-6,y]]);
      }
      break;
    }
    case "mueck":{
      layer(theme.ink,.20,2.2);
      for(let x=31;x<size;x+=64)line([[x,38],[x,466]]);
      layer(theme.light,.30,1);
      for(let y=48;y<461;y+=6)line([[0,y],[size,y]]);
      for(const [x,y] of [[105,123],[346,203]]){
        layer(theme.ink,.25,3);
        ctx.beginPath();ctx.moveTo(x-52,y+220);
        ctx.bezierCurveTo(x-16,y+181,x-36,y+138,x-50,y+87);
        ctx.bezierCurveTo(x-79,y-32,x+99,y-18,x+75,y+74);
        ctx.bezierCurveTo(x+51,y+139,x+22,y+102,x+33,y+220);ctx.stroke();
        layer(theme.accent,.32,1.2);
        arc(x+7,y+59,46,.23,Math.PI-.18);
      }
      break;
    }
  }

  // Subtle ink grain and a narrow printed selvage keep the broad pattern from looking flat.
  for(let i=0;i<3800;i++){
    const x=(i*157+Math.floor(i/31)*23)%size,y=(i*269+Math.floor(i/43)*31)%size;
    layer(i%3?theme.light:theme.ink,.09,1);ctx.fillRect(x,y,1+i%2,1+(i>>1)%2);
  }
  for(const [color,alpha,y,w] of [[theme.ink,.36,22,3],[theme.accent,.48,29,2],
    [theme.light,.56,33,1],[theme.light,.56,475,1],[theme.accent,.48,480,2],[theme.ink,.36,489,3]]){
    layer(color,alpha,w);line([[0,y],[size,y]]);
  }
  return canvas;
}

export function addMmcaWallpaper(T,parent,{wx,wz},room,ceilingHeight){
  const theme=wallThemes[room.id];
  const map=new T.CanvasTexture(wallpaperTile(room.id,theme));map.colorSpace=T.SRGBColorSpace;
  map.wrapS=T.RepeatWrapping;map.anisotropy=4;
  const geometry=new T.BufferGeometry(),positions=[],uv=[],indices=[];
  const base=.252,top=ceilingHeight-.06,face=.152;
  const left=room.minX+face,right=room.maxX-face,front=room.minY+face,back=room.maxY-face;

  function pane(x1,z1,x2,z2,start=0,bottom=base){
    const index=positions.length/3,distance=Math.hypot(x2-x1,z2-z1),v=(bottom-base)/(top-base);
    positions.push(wx(x1),bottom,wz(z1),wx(x2),bottom,wz(z2),wx(x2),top,wz(z2),wx(x1),top,wz(z1));
    uv.push(start/theme.repeat,v,(start+distance)/theme.repeat,v,(start+distance)/theme.repeat,1,start/theme.repeat,1);
    indices.push(index,index+1,index+2,index,index+2,index+3);
  }

  pane(left,front,right,front);
  pane(right,back,left,back);
  const west=room.doorX===room.maxX,after=room.doorY+3,before=room.doorY-3;
  if(west){
    pane(left,back,left,front);
    pane(right,front,right,before);pane(right,after,right,back,after-front);
    pane(room.doorX-.166,before,room.doorX-.166,after,before-front,3.94);
  }else{
    pane(right,front,right,back);
    pane(left,back,left,after);pane(left,before,left,front,back-before);
    pane(room.doorX+.166,after,room.doorX+.166,before,back-after,3.94);
  }
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const wall=new T.Mesh(geometry,new T.MeshBasicMaterial({map,toneMapped:false}));
  wall.name=`${room.name} 벽지`;parent.add(wall);
  return wall;
}
