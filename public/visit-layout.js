// The portal places gallery visitors beyond the outdoor terrain and collision grid.
export const museumInteriorOffsetY=520;
export const museumBounds={minX:49,maxX:111,minY:48+museumInteriorOffsetY,maxY:94+museumInteriorOffsetY};
export const museumHall={minX:74.7,maxX:85.3,splitY:69+museumInteriorOffsetY,doorWidth:5.8};

export const museumGalleries=[
  {id:"silla",name:"삼국·통일신라관",shortName:"신라",theme:"삼국 벽화·공예와 통일신라 불교 미술",side:"west",doorY:81,mapColor:"#845f4f"},
  {id:"goryeo",name:"고려관",shortName:"고려",theme:"청자·불화·금속 공예",side:"west",doorY:59,mapColor:"#557669"},
  {id:"joseon",name:"조선관",shortName:"조선",theme:"조선의 회화와 도자기",side:"east",doorY:59,mapColor:"#8d6d4c"},
  {id:"modern",name:"대한제국·근대관",shortName:"근대",theme:"궁중 유물과 근대 회화",side:"east",doorY:81,mapColor:"#526c7d"}
].map(({doorY:localDoorY,...gallery})=>{
  const doorY=localDoorY+museumInteriorOffsetY;
  const west=gallery.side==="west",north=doorY<museumHall.splitY;
  return {...gallery,doorY,
    minX:west?museumBounds.minX:museumHall.maxX,
    maxX:west?museumHall.minX:museumBounds.maxX,
    minY:north?museumBounds.minY:museumHall.splitY,
    maxY:north?museumHall.splitY:museumBounds.maxY,
    doorX:west?museumHall.minX:museumHall.maxX
  };
});

export function isInsideMuseum(x,y){
  const {minX,maxX,minY,maxY}=museumBounds;
  return x>minX&&x<maxX&&y>minY&&y<maxY;
}

export function museumGalleryAt(x,y){
  return museumGalleries.find(room=>x>room.minX&&x<room.maxX&&y>room.minY&&y<room.maxY);
}
