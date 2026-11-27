// The front of each door faces local +Z. The portal and the return point both
// sit on the public side of the solid exterior wall.
function churchEntry(name,x,y,angle){
  const heading=(180-angle*180/Math.PI+360)%360;
  const outsideDoor={x:x+1.45*Math.sin(angle),y:y+1.45*Math.cos(angle),heading};
  return {name,facade:{x,y,angle},outsideDoor};
}

export const jeongdongChurchEntry=churchEntry("정동제일교회",133.63,273.38,Math.PI);

const cathedralAngle=-.38;
export const seoulCathedralEntry=churchEntry("대한성공회 서울주교좌성당",
  409.8+19.75*Math.sin(cathedralAngle),88.1+19.75*Math.cos(cathedralAngle),cathedralAngle);
