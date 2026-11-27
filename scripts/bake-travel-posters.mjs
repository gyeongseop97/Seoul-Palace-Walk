// Bake the city travel loops with Sharp 0.35. Run from any directory.
// node scripts/bake-travel-posters.mjs [path-to-sharp]
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {writeFile} from "node:fs/promises";

const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]??"sharp");
const out=fileURLToPath(new URL("../public/art/",import.meta.url));
const width=768,height=512,frames=32;
const bg={seoul:"#DDEEFF",pohang:"#C1EDF2",gyeongju:"#D8E8F9"};
const cream="#FFF6D8",navy="#143C71",coral="#F28770";
const f=n=>Number(n.toFixed(2));
const path=(d,fill)=>`<path fill="${fill}" d="${d}"/>`;
const line=(d,color,weight,cap="round")=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linejoin="round" stroke-linecap="${cap}"/>`;
const rect=(x,y,w,h,color,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>`;
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const group=(parts,transform="")=>`<g transform="${transform}">${parts.join("")}</g>`;
const at=(parts,x,y,s=1)=>group(parts,`translate(${f(x)} ${f(y)}) scale(${s})`);
const repeat=(count,fn)=>Array.from({length:count},(_,i)=>fn(i)).join("");
const sine=t=>Math.sin(2*Math.PI*t);
const spark=(x,y,r,c)=>at([path("M0 -10 Q1.6 -1.6 9 0 Q1.6 1.6 0 10 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -10 Z",c)],x,y,r/10);

function cloud(x,y,scale,color){
  return at([path("M0 17 H10 C10 7 18 2 28 5 C33 -4 49 -3 54 8 C63 5 73 10 73 17 H85 V21 H0 Z",color)],x,y,scale);
}
function pine(x,y,s,foliage){
  return at([path("M-2 -30 H2 L3 0 H-3 Z",navy),path("M0 -58 L10 -40 H6 L17 -25 H12 L21 -14 H-21 L-11 -26 H-16 L-6 -40 H-10 Z",foliage)],x,y,s);
}
function masonry(x,y,w,rows,gap,color,unit){
  return repeat(rows,i=>{
    const marks=[line(`M${x} ${y+i*gap}h${w}`,color,.95,"butt")];
    for(let j=0;j<w;j+=unit){const left=j+(i%2?unit*.5:1);if(left<w)marks.push(line(`M${x+left} ${y+i*gap}v${gap}`,color,.95,"butt"));}
    return marks.join("");
  });
}

// The granite guardian has a blunt muzzle, curled mane, split hooves and a horn above the brow.
function haechi(x,y,s){
  const dark="#486A9F",stone="#ABC7E7",light="#EAF4F1",shadow="#7297C2";
  return at([
    path("M20 115 H117 L124 122 V127 H12 V122 Z",dark),rect(15,111,105,6,stone),
    path("M30 83 Q11 87 8 73 Q4 61 15 48 Q27 38 23 31 Q37 31 36 44 Q35 52 25 58 Q15 66 21 70 Q25 73 32 65 Z",dark),
    line("M29 76 Q19 77 19 71 Q18 66 27 59",stone,3),
    path("M25 98 L23 87 Q18 69 32 53 Q43 41 66 43 L73 32 Q73 20 85 15 L83 5 Q94 6 98 14 L108 8 L108 24 Q117 28 118 36 L132 40 Q134 47 126 52 L118 55 L116 67 L110 69 Q111 76 101 80 L101 103 Q102 108 112 108 L114 114 H89 L84 95 L77 83 L64 88 L55 100 L56 107 L67 108 L67 114 H41 L37 100 L32 105 L33 110 L40 111 L40 115 H20 Q18 107 25 98Z",dark),
    path("M27 87 Q24 69 37 56 Q47 46 65 48 Q74 51 76 61 Q77 71 66 76 L56 80 Q46 85 45 97 L44 106 H36 Q29 100 27 87Z",stone),
    line("M36 72 Q47 54 61 58 Q69 61 65 67 Q62 71 54 69",shadow,3.3),
    line("M32 79q4 6 8 0m1 2q4 5 8 0m-14 5q4 5 8 0",shadow,1.8),
    path("M65 48 Q66 36 75 32 Q73 21 84 18 Q90 14 98 20 L105 16 L103 27 Q113 28 114 38 L128 42 L126 47 L116 49 Q111 59 99 55 Q96 69 87 71 Q88 81 79 82 L78 72 Q68 79 63 74 Q70 68 68 61 Q60 57 65 48Z",light),
    line("M70 47 Q72 38 80 38 Q89 38 87 45 Q85 49 80 47",shadow,3),
    line("M76 55 Q85 58 89 52 M77 63 Q86 67 91 59 M95 31 L105 28",dark,2.8),
    circle(104,34,2.8,navy),circle(105,33,0.9,cream),
    path("M113 37q5 -3 10 0q8 -2 9 4q2 6 -6 8h-12q-4 -5 -1 -12Z",stone),
    path("M122 37q8 -2 9 3q0 4 -7 4l-4 -2Z",dark),line("M109 49q11 5 18 -1",dark,2.3),
    path("M112 51 L115 56 L118 51Z",cream),path("M90 80 L95 74 L96 102 L104 107 L93 107Z",stone),line("M42 110h10 M96 110h10",shadow,2)
  ],x,y,s);
}

function palaceRoof(w,eave,rise,roof,rim){
  const h=w/2;return [
    path(`M${-h} ${eave-5} Q${-h*.78} ${eave-4} ${-h*.48} ${eave-rise+3} L${-h*.43} ${eave-rise-1} H${h*.43} L${h*.48} ${eave-rise+3} Q${h*.78} ${eave-4} ${h} ${eave-5} L${h-5} ${eave+2} Q${h*.52} ${eave+8} 0 ${eave+6} Q${-h*.52} ${eave+8} ${-h+5} ${eave+2}Z`,roof),
    line(`M${-h*.98} ${eave-3} Q${-h*.53} ${eave+4} 0 ${eave+3} Q${h*.53} ${eave+4} ${h*.98} ${eave-3}`,rim,2.3),
    line(`M${-h*.45} ${eave-rise-2} Q0 ${eave-rise+1} ${h*.45} ${eave-rise-2}`,roof,4)
  ].join("");
}
function sungnyemun(x,y,s){
  return at([
    path("M-114 103 L-103 73 H-84 V44 H84 V73 H103 L114 103Z","#789CBF"),
    path("M-119 103 L-109 74 H-85 V46 H85 V74 H109 L119 103Z M-16 103 V91 A16 16 0 0 1 16 91 V103Z",navy),
    path("M-105 100 L-98 79 H-79 V49 H79 V79 H98 L105 100 H24 V93 A24 24 0 0 0 -24 93 V100Z","#ADC8D6"),
    path("M-16 103 V92 A16 16 0 0 1 16 92 V103Z","#577FA0"),path("M-10 103 V93 A10 10 0 0 1 10 93 V103Z",navy),
    masonry(-75,55,150,2,7,"#789AAE",13),
    rect(-78,39,156,9,cream),rect(-81,46,162,4,navy),
    rect(-71,22,142,18,"#BD7258"),repeat(9,i=>rect(-65+i*15.5,24,9,12,"#789D94")),
    repeat(10,i=>rect(-72+i*15.6,21,3,19,"#9D4A43")),rect(-74,37,148,4,"#476D71"),
    rect(-55,0,110,24,"#AB614C"),repeat(7,i=>rect(-51+i*15,3,10,12,"#85B7AF")),repeat(8,i=>rect(-56+i*16,0,3,20,"#A64F49")),
    palaceRoof(186,19,15,navy,"#67A9BB"),palaceRoof(150,-1,19,navy,"#76B3BA"),
    rect(-12,2,24,8,"#143C58"),line("M-7 6 h14","#DDB67A",1.5),
    rect(-123,102,246,4,"#335987",2)
  ],x,y,s);
}
function tower(x,y,t){
  const red="#E98468";
  return at([
    path("M-5 0 L-3 -62 H3 L6 0Z","#6794BC"),rect(-2,-76,4,33,cream),path("M-7 -68 L-10 -75 H10 L7 -68Z",navy),
    rect(-11,-81,22,7,cream,2),rect(-10,-78,20,3,"#3771A9"),
    path("M-12 -83 L-7 -88 H7 L12 -83Z",navy),rect(-2,-108,4,21,"#F4EBDC"),
    rect(-2,-108,4,6,red),rect(-1,-116,2,9,navy),circle(0,-117,1.7+(.5+.5*sine(t))*.8,red),
    line("M-5 -95 H5 M-5 -98 H5",navy,1.6)
  ],x,y,1.18);
}
function seoul(t){
  return [
    cloud(70+4*sine(t),135,.78,"#F5F8ED"),cloud(592-7*sine(t),107,.93,"#F5F8ED"),
    circle(622,223,26,"#FFCF7B"),path("M587 254h71v8h-71z",bg.seoul),
    path("M51 404 Q112 397 169 368 Q229 339 292 365 Q342 383 402 365 Q467 342 506 336 Q545 325 577 313 Q608 297 644 322 Q671 344 708 348 L727 411Z","#BCD7EB"),
    path("M402 407 Q471 394 518 368 Q561 339 588 331 Q605 324 621 334 L699 382 L728 406Z","#93BCDB"),
    tower(603,331,t),path("M474 416 Q541 389 577 367 Q644 326 682 366 L712 390 L728 416Z","#79ABC9"),
    pine(566,372,.57,"#6B9FB8"),pine(550,379,.39,"#70A7BD"),
    path("M41 421 L71 408 H91 L91 399 H188 L201 406 H257 L270 400 H313 L324 409 H426 L464 392 H527 L553 403 H634 L658 393 H693 L726 415 L709 427 H57Z","#86B1CB"),
    at([rect(0,0,16,40,"#77A4C7"),rect(18,-13,15,53,"#75A3C4"),rect(35,9,18,31,"#82AFCA"),rect(57,-6,9,46,"#77A4C7")],228,364),
    sungnyemun(426,325,.91),haechi(83,295,.96),
    path("M54 427 H718 L702 435 H516 L502 440 H191 L181 436 H72Z","#4F83AD"),
    line("M106 444 H235 M575 442 H664","#9CBAD3",2.5),
    spark(93,276,4,cream)
  ];
}
function spaceWalk(x,y,s){
  // The stairs traverse a continuous sinuous truss, with the closed loop prominent above the hill.
  const iron="#235678",lit="#E7FAEA",edge="#58A5BC";
  const top="M0 93 Q22 86 40 67 Q62 45 92 62 C111 75 127 74 137 61 Q157 31 180 33 C201 36 222 21 217 4 C210 -17 187 -11 180 9 C172 28 184 43 199 44 Q211 47 195 58 Q168 74 153 92";
  const posts=[[5,91,109],[26,78,109],[50,60,106],[77,56,101],[99,66,97],[118,69,97],[139,58,94],[155,40,94],[170,34,88],[182,33,84],[202,44,84],[212,22,79],[199,56,82],[177,71,88],[162,82,92]];
  return at([
    repeat(posts.length,i=>{const [a,b,d]=posts[i];return line(`M${a} ${b+2}V${d}`,edge,i%3===0?2.5:1.65,"butt");}),
    line("M7 99 L26 83 L49 100 L75 60 L99 94 L120 73 L140 90 L155 41 L171 81 L182 37 L200 76 L212 26",edge,1.6,"butt"),
    line(top,iron,6,"round"),line(top,lit,2.2,"round"),group([line(top,iron,1.45,"round")],"translate(0 -4)"),
    repeat(11,i=>{const [a,b]=posts[i];return line(`M${a} ${b}v-4.2`,iron,1.6,"butt");})
  ],x,y,s);
}
function ferry(x,y,s){
  return at([
    path("M-4 54 H179 L162 76 Q149 83 120 83 H34 Q17 82 7 70Z",navy),
    path("M1 55 H177 L171 64 H10Z","#F9F2D6"),path("M11 70 H169 L164 76 H18Z","#F07965"),
    path("M14 43 H152 L159 55 H10Z",cream),path("M29 31H134L144 43H24Z","#F7FAE8"),
    path("M48 21 H113 L127 32 H40Z","#E8EFE1"),path("M74 20v-9h21l7 9Z",cream),
    path("M46 8 H55 L62 24 H48Z",navy),path("M47 11h9l2 5h-10Z",coral),
    line("M108 22V3 M108 6l11 3-11 2",navy,2,"butt"),
    repeat(11,i=>rect(31+i*9.5,35,6.4,4.3,"#4A89AC",.7)),repeat(13,i=>rect(20+i*9.8,47,6.7,4.2,"#4B83A3",.65)),
    repeat(7,i=>rect(53+i*8.7,25,6,3.7,"#447A9D",.5)),rect(76,14,6,4,"#4A83A3"),rect(85,14,6,4,"#4A83A3"),
    repeat(5,i=>circle(73+i*15,71,1.6,cream))
  ],x,y,s);
}
function wave(x,y,w,color){
  return line(`M${f(x)} ${f(y)}q${f(w*.25)} -3.4 ${f(w*.5)} 0t${f(w*.5)} 0`,color,2.2,"round");
}
function pohang(t){
  const dx=4*sine(t),z=2*sine(t);
  return [
    cloud(82+dx,120,1.12,"#E8F7E5"),cloud(600-dx,142,.7,"#E3F4E5"),circle(130,252,30,"#FFCF7F"),
    path("M46 369 Q90 353 122 359 Q177 347 225 360 Q268 352 296 361 Q340 351 395 357 L448 375 H45Z","#98CFD6"),
    path("M399 376 Q460 367 511 350 Q562 326 601 332 Q638 328 666 340 Q690 349 722 351 V380Z","#8CBFC5"),
    spaceWalk(461,267,1.02),
    path("M425 374 Q492 368 533 345 Q571 333 587 340 Q624 317 657 334 Q690 344 720 346 L733 375 L703 386Z","#4E8793"),
    path("M36 378 Q83 370 130 377 Q177 382 230 374 Q280 370 327 376 Q373 379 423 374 Q480 366 541 375 Q610 381 666 372 Q694 371 731 375 L709 403 L52 407Z","#6EBFC5"),
    path("M50 401 Q104 390 170 398 Q221 405 281 397 Q330 389 394 397 Q443 404 512 395 Q567 387 624 395 Q675 403 716 394 L697 420 L78 424Z","#399BAF"),
    ferry(115+dx,310+z,1.05),
    line(`M${f(86+dx)} ${f(396+z)}q20 -3 39 1t33 1`,"#E2F6E1",3.1),
    path("M56 416 Q106 410 165 415 T291 415 T425 414 T562 412 T706 410 L694 422 Q649 430 579 423 Q530 421 494 428 H196 L167 425 H79Z","#277595"),
    [70,330,500,640].map((x,i)=>wave(x+dx*(i%2?1:-1),390+i%2*11,28+i*3,"#B6E2D9")).join(""),
    [119,236,408,580].map((x,i)=>wave(x-dx,423+i%2*8,32+i*4,"#A1D7D6")).join(""),
    repeat(3,i=>{const px=283+i*22+dx*1.1,py=302+(i%2)*10+sine(t+i/8)*2;return line(`M${f(px)} ${f(py)}q4 -3.8 8 .5 q3 -4.3 7 -4.5`,"#46869F",1.85);})
  ];
}
function cheomseongdae(x,y,s){
  const outline="M-33 94 Q-16 55 -20 13 H20 Q16 55 33 94Z";
  return at([
    rect(-39,94,78,7,"#6D91AB"),rect(-43,100,86,5,"#527C9C",1),path(outline,"#D5CBB2"),
    '<clipPath id="tower-stones"><path d="'+outline+'"/></clipPath>',
    '<g clip-path="url(#tower-stones)">'+path("M9 12 Q6 64 21 97 H42 L25 11Z","#A29482")+masonry(-34,13,71,15,5.6,"#A39883",11.7)+'</g>',
    rect(-6,53,12,14,"#4D5D65"),rect(-5,54,10,4,"#384F62"),
    rect(-24,9,48,6,"#9F9B8E"),rect(-24,4,13,6,"#DCD2B5"),rect(-10,4,21,6,"#D9CCAA"),rect(12,4,12,6,"#C3BBA3"),
    rect(-28,0,56,4,"#BCC3B4")
  ],x,y,s);
}
function daeungjeon(x,y,s){
  return at([
    path("M-86 60 H86 L94 69 H-94Z","#BED0C8"),rect(-95,69,190,5,"#7390A1"),
    path("M-20 65 H20 L30 74 H-30Z","#E3DBBF"),line("M-23 69h46 M-26 72h52","#9AA9A3",1),
    rect(-73,16,146,42,"#B46654"),rect(-69,20,138,35,"#C7AA76"),
    repeat(7,i=>at([rect(0,0,13,27,"#7DA99D"),line("M3 0v27M7 0v27M11 0v27M0 6h13M0 12h13M0 18h13M0 24h13","#D5CB9A",1)],-64+i*19,25)),
    repeat(8,i=>rect(-75+i*21,16,4.6,45,"#A74E43")),rect(-77,57,154,4,"#755454"),
    rect(-78,11,156,8,"#548F82"),repeat(13,i=>path(`M${-72+i*12} 14l4 5 4 -5Z`,"#DAA565")),
    palaceRoof(198,8,30,"#244F73","#84B8B8"),rect(-13,12,26,8,"#354E5B"),line("M-8 16h16","#E9BB68",1.6)
  ],x,y,s);
}
function crown(x,y,s,t){
  const ochre="#C68B38",light="#FFE299",amber="#ECC05D",jade="#52AFA4";
  const branch=(px,py,size)=>at([
    path("M-3 0V-58L0 -65L3 -58V-43L10 -50V-56L14 -61L16 -55V-47L3 -33V-23L13 -32V-37L17 -43L19 -37V-28L3 -14V0Z",amber),
    path("M2 -33 L-13 -45 V-53 L-10 -59 L-7 -53 V-48 L1 -40ZM1 -14 L-16 -28 V-35 L-13 -42 L-10 -36 V-32 L1 -22Z",amber),
    line("M0 -56 V-3",light,1.4)
  ],px,py,size);
  const comma=(px,py)=>at([path("M0 -2 Q4 -3 4 1.5 Q4 6 -.8 8 Q-4 9 -4 6 Q-4 4 -1 3 Q.9 2 0 0Z",jade)],px,py);
  return at([
    line("M-36 -2 Q-50 -25 -43 -43 Q-42 -51 -47 -58 M-42 -37 Q-52 -35 -54 -45 M-42 -46 Q-34 -47 -36 -57",ochre,3.7),
    line("M34 -1 Q51 -23 45 -42 Q42 -51 48 -59 M45 -34 Q54 -34 56 -45 M45 -46 Q36 -46 37 -57",ochre,3.7),
    branch(-24,-5,.68),branch(0,-6,.98),branch(24,-5,.70),
    path("M-42 -8 Q0 1 42 -8 L39 7 Q0 17 -39 7Z",amber),line("M-38 -4 Q0 4 38 -4 M-36 4 Q0 12 36 4",light,1.7),
    repeat(9,i=>circle(-32+i*8,1.5+3*Math.sin(i*Math.PI/8),1.4,ochre)),
    [-35,-16,16,36].map((p,i)=>{const dx=sine(t+i*.05)*1.2,yy=i%3?13:22;return line(`M${p} 6q${dx} 6 ${dx} ${yy-3}`,ochre,1.1)+comma(p+dx,yy+4);}).join(""),
    [-21,11].map((p,i)=>line(`M${p} -38v6`,ochre,1)+comma(p,-31+i)).join("")
  ],x,y,s);
}
function gyeongju(t){
  return [
    cloud(80+5*sine(t),142,.8,"#F3F5E8"),cloud(566-6*sine(t),102,1.1,"#EFF3E8"),
    circle(613,244,23,"#F2BC77"),
    path("M36 387 Q98 381 151 350 Q205 321 259 341 Q308 357 345 345 Q393 329 446 341 Q503 354 551 330 Q598 304 635 322 Q662 330 724 355 L731 405Z","#B2CBDA"),
    path("M45 410 Q95 410 123 389 Q157 341 199 347 Q235 353 254 385 Q273 400 305 396 Q352 391 382 370 Q423 344 467 360 Q506 379 543 376 Q593 365 659 380 L729 399 L710 420Z","#8FB7B9"),
    pine(538,375,.64,"#63989A"),pine(550,375,.45,"#72A3A1"),pine(278,374,.5,"#719C9C"),
    path("M40 418 Q104 394 175 397 Q245 402 298 385 Q362 364 432 387 Q491 407 548 391 Q627 371 675 385 Q695 390 731 405 L697 434 L74 435Z","#78A6A4"),
    cheomseongdae(147,296,1.17),daeungjeon(381,333,1.08),
    path("M519 421 Q546 400 573 395 L616 392 L635 404 L685 401 L714 415 L693 426Z","#5C8791"),
    path("M531 412 Q586 397 646 404 L676 409 L658 415 H549Z","#99BFB3"),
    path("M604 377H617L621 396H600Z","#76A7AB"),path("M581 399L590 395H631L641 399L635 403H586Z","#587F8C"),
    crown(611,370,.98,t),spark(670,318,3.4+1.2*sine(t),cream),
    path("M59 432 Q134 423 198 429 L240 429 Q307 413 368 417 Q419 419 465 429 Q532 440 600 426 Q650 418 701 427 L686 437 L589 439 L562 445 L405 444 L375 438 H275 L235 446 H107Z","#558A94"),
    line("M117 448h55 M472 448h64","#9BBAB9",2.4)
  ];
}

for(const [city,draw] of Object.entries({seoul,pohang,gyeongju})){
  const buffers=[];
  for(let i=0;i<frames;i++){
    const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 768 512">${rect(0,0,width,height,bg[city])}${draw(i/frames).join("")}</svg>`);
    const raster=sharp(svg).removeAlpha();
    if(!i)await raster.clone().png({palette:true,colours:128,dither:0}).toFile(out+"loading-"+city+".png");
    buffers.push(await raster.raw().toBuffer());
  }
  const joined=Buffer.concat(buffers);
  const gif=await sharp(joined,{raw:{width,height:height*frames,pageHeight:height,channels:3}})
    .gif({delay:Array(frames).fill(100),loop:0,colours:96,dither:0,effort:5}).toBuffer();
  await writeFile(out+"loading-"+city+".gif",gif);
  const meta=await sharp(gif,{animated:true}).metadata();
  if(meta.pages!==frames||meta.loop!==0||meta.pageHeight!==height||meta.delay.some(ms=>ms!==100))throw Error("Incomplete loop: "+city);
  console.log(city,meta.pages,"frames",gif.length,"bytes");
}
