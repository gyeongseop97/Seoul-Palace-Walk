const majorNames=new Map([
  ["서울역","서울역"],["문화역서울284","문화역서울284"],["숭례문","숭례문"],
  ["서울시립미술관","시립미술관"],["경희궁 숭정전","경희궁 · 숭정전"],["경희궁 흥화문","흥화문"],
  ["대한문","대한문"],["중화전","중화전"],["석조전","석조전"],
  ["정동 분수","정동 분수"],["서울광장","서울광장"],["환구단 정문","환구단"],
  ["이순신장군 동상","이순신상"],["세종대왕 동상","세종대왕상"],
  ["광화문","광화문"],["근정전","근정전"],["경회루","경회루"],["향원정","향원정"],
  ["국립현대미술관 입구","국현미"],["가회동 한옥 골목","한옥 골목"],
  ["세종로공원","세종로공원"],["의정부지 역사유적광장","의정부지"],
  ["열린송현녹지광장","열린송현"],["청계광장","청계광장"]
]);
const shortNames=new Map([
  ["덕수궁 전시관 입구","석조전 전시관"],["국립고궁박물관","고궁박물관"],
  ["국립민속박물관","민속박물관"],["국립민속박물관 앞 삼청로","민속박물관 앞"],
  ["국립현대미술관 서울 앞","국현미 앞"],
  ["열린송현 율곡로 입구","율곡로 입구"],["열린송현 종친부길 입구","종친부길 입구"],["송현 감고당길 입구","감고당길 입구"],
  ["정동제일교회","정동교회"],["삼청동 돌계단길 · 북촌 8경","돌계단길"],
  ["삼청동 돌계단길 아래","돌계단 아래"],["자경전 십장생 굴뚝","십장생 굴뚝"],
  ["시청앞·덕수궁 정류장","덕수궁 정류장"],["서울광장·환구단 정류장","환구단 정류장"],
  ["세종문화회관 정류장 건너편","세종회관 맞은편"],["세종문화회관 정류장","세종회관 정류장"],
  ["삼청동 돌계단길 정류장","돌계단 정류장"],["삼청로·북촌 정류장","북촌 정류장"]
]);
const fontPixels=11;
const detailCategories=new Set(["shop","bus","bike","stamp"]);
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;

function shortName(name,category){
  const plain=name.split(" · ")[0].replace(/(역 \d+번) 출구$/u,"$1");
  return majorNames.get(name)??shortNames.get(name)??shortNames.get(plain)??
    (category==="bike"?plain.replace(/\s*따릉이(?: 대여소)?$/u,""):plain);
}

export function bindMapLabels(svg,layer){
  const labels=[],measure=svg.ownerDocument.createElement("canvas").getContext("2d");
  let viewport=null,frame=0,ordered=null,fontFamily="";
  function request(){
    if(!frame)frame=requestAnimationFrame(draw);
  }
  function add(mark,point,category,{area=false,indoors=false}={}){
    const text=area?point.name:shortName(point.name,category);
    if(!text)return;
    const priority=area?4:indoors||majorNames.has(point.name)&&category!=="stamp"?3:detailCategories.has(category)?1:2;
    const node=svg.ownerDocument.createElementNS(svg.namespaceURI,"text");
    node.setAttribute("class",area?"map-marker-label map-area-label":"map-marker-label");
    node.setAttribute("hidden","");
    for(const attribute of ["data-map-place","data-stamp-id","data-walk-x","data-walk-y"]){
      if(mark.hasAttribute(attribute))node.setAttribute(attribute,mark.getAttribute(attribute));
    }
    node.textContent=text;layer.append(node);
    labels.push({mark,node,point,priority,text,width:0});ordered=null;
    request();
  }
  function draw(){
    frame=0;
    if(!viewport)return;
    const {base,view,overview}=viewport;
    const width=svg.clientWidth,height=svg.clientHeight,scale=Math.min(width/view.w,height/view.h);
    if(!(scale>0))return;
    const offsetX=(width-view.w*scale)/2,offsetY=(height-view.h*scale)/2,zoom=base.w/view.w;
    if(!ordered)ordered=[...labels].sort((a,b)=>b.priority-a.priority);
    if(!fontFamily)fontFamily=getComputedStyle(svg).fontFamily;
    svg.style.setProperty("--map-marker-font",fontPixels/scale+"px");
    svg.style.setProperty("--map-marker-stroke",2.7/scale+"px");
    const boxes=[],names=new Map();
    for(const label of ordered){
      const {mark,node,point,priority,text}=label;
      const limit=priority>=3?0:priority===2?(overview?1.9:1.22):(overview?2.8:1.52);
      const x=(point.x-view.x)*scale+offsetX,y=(point.y-view.y)*scale+offsetY;
      let accepted=null;
      if(zoom>=limit&&x>=0&&x<=width&&y>=0&&y<=height&&!mark.closest('[hidden],[visibility="hidden"]')){
        const font=fontPixels+(priority===4?2:0);
        if(!label.width){
          if(measure)measure.font=`650 ${font}px ${fontFamily}`;
          label.width=Math.ceil(measure?.measureText(text).width||text.length*font);
        }
        const w=label.width;
        const last=names.get(text);
        if(!last||Math.hypot(last.x-x,last.y-y)>48){
          const candidates=[[x+7,y-font/2],[x-w-7,y-font/2],[x-w/2,y-font-7],[x-w/2,y+7]];
          if(priority>=3)candidates.push([x+9,y-font-8],[x-w-9,y+7],[x+9,y+7],[x-w-9,y-font-8]);
          if(priority===4)candidates.push([x+24,y-font/2],[x-w-24,y-font/2]);
          for(const [left,top] of candidates){
            const box={left:left-2,right:left+w+2,top:top-2,bottom:top+font+2};
            if(box.left<0||box.right>width||box.top<0||box.bottom>height||boxes.some(other=>overlaps(box,other)))continue;
            accepted={left,top,box};break;
          }
        }
        if(accepted){
          boxes.push(accepted.box);names.set(text,{x,y});
          node.setAttribute("x",view.x+(accepted.left-offsetX)/scale);
          node.setAttribute("y",view.y+(accepted.top+font*.84-offsetY)/scale);
        }
      }
      node.toggleAttribute("hidden",!accepted);
    }
  }
  new ResizeObserver(request).observe(svg);
  return {add,request,setView(base,view,overview){viewport={base,view,overview};request();}};
}
