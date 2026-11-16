export function diningPoint(x,y,venue=diningVenue){
  return {x:venue.center.x+x,y:venue.center.y+y};
}

function venue(id,name,area,street,centerX,plotX,plotY,angle,dish){
  const center={x:centerX,y:515},plot={x:plotX,y:plotY,w:13.4,d:9.4,angle};
  const local={center};
  const reach=plot.d/2+1.4;
  return {id,name,area,street,center,plot,dishes:[dish],
    bounds:{minX:center.x-12,maxX:center.x+12,minY:center.y-12,maxY:center.y+12},
    outsideDoor:{x:plot.x+Math.sin(angle)*reach,y:plot.y+Math.cos(angle)*reach,
      heading:(540-angle*180/Math.PI)%360},
    insideDoor:{...diningPoint(0,10.6,local),heading:180},
    insideSpawn:{...diningPoint(0,8.3,local),heading:0},
    menuPoint:diningPoint(0,-7.4,local),guestbookPoint:diningPoint(5.6,9.1,local)
  };
}

export const diningVenue=venue("bukchon-dining","북촌 작은 식탁","bukchon","삼청로",765,725,-1095,-Math.PI/2,{
  kind:"sujebi",name:"삼청동 손수제비",description:"감자와 애호박, 김가루를 곁들인 손수제비",
  source:"https://english.visitseoul.net/attractions/Samcheong-dongSujebi/ENPqgbap0"
});
export const diningVenues=[diningVenue,
  venue("jeongdong-dining","정동 메밀집","jeongdong","덕수궁 돌담길",250,348.5,339.6,Math.PI,{
    kind:"buckwheatNoodles",name:"정동 메밀국수",description:"메밀면에 오이와 달걀을 올리고 매콤한 양념을 곁들인 한 그릇",
    source:"https://korean.visitseoul.net/restaurants/%EC%9C%A0%EB%A6%BC%EB%A9%B4/KOP012801"
  }),
  venue("plaza-dining","피맛골 장국밥집","gwanghwamun","광화문광장",600,535.8,-415.7,-Math.PI/2,{
    kind:"jangGukbap",name:"피맛골 장국밥",description:"쇠고기 장국에 밥을 말고 파를 얹은 한 그릇",
    source:"https://archives.seoul.go.kr/post/2737"
  })
];
export const diningMenu=diningVenues.flatMap(place=>place.dishes);
