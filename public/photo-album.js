let database;
function openAlbum(){
  database??=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(Error("이 브라우저에서 사진을 저장할 수 없어요."));return;}
    const request=indexedDB.open("deoksugung-walk-album",1);
    request.onupgradeneeded=()=>request.result.createObjectStore("photos",{keyPath:"id"});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }).catch(error=>{database=null;throw error;});
  return database;
}

export async function listPhotos(){
  const db=await openAlbum();
  return new Promise((resolve,reject)=>{
    const request=db.transaction("photos").objectStore("photos").getAll();
    request.onsuccess=()=>resolve(request.result.sort((a,b)=>b.date-a.date));
    request.onerror=()=>reject(request.error);
  });
}

export async function importPhotos(records){
  if(!records.length)return;
  const db=await openAlbum();
  await new Promise((resolve,reject)=>{
    const transaction=db.transaction("photos","readwrite"),store=transaction.objectStore("photos");
    for(const record of records)store.put(record);
    transaction.oncomplete=resolve;
    transaction.onabort=()=>reject(transaction.error);
    transaction.onerror=()=>reject(transaction.error);
  });
}

const photoDate=new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"});
export async function makePhotoCard(picture,{place,date,nickname,mode}){
  if(!picture)throw Error("사진을 찍지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  const image=new Image();image.src=picture;await image.decode();
  const canvas=document.createElement("canvas"),scale=Math.min(1,1280/image.width);
  const width=Math.round(image.width*scale),height=Math.round(image.height*scale);
  const border=Math.max(12,Math.round(width*.02)),footer=Math.max(62,Math.round(width*.085));
  canvas.width=width+border*2;canvas.height=height+border+footer;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#f4faff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,border,border,width,height);
  ctx.fillStyle="#192c4b";ctx.textBaseline="top";
  ctx.font=`bold ${Math.max(15,Math.round(width*.029))}px "Malgun Gothic",sans-serif`;
  ctx.fillText(place,border,height+border+footer*.17,width);
  ctx.fillStyle="#3d5270";
  ctx.font=`${Math.max(11,Math.round(width*.016))}px "Malgun Gothic",sans-serif`;
  ctx.fillText(`${photoDate.format(date)} · ${nickname} · 유람`,border,height+border+footer*.59,width);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.87));
  if(!blob)throw Error("공유용 사진을 만들지 못했어요.");
  return {id:crypto.randomUUID(),date,place,mode,blob};
}

export function downloadPhoto(photo){
  const url=URL.createObjectURL(photo.blob),link=document.createElement("a");
  link.href=url;link.download=`유람-${new Date(photo.date).toISOString().slice(0,10)}.jpg`;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function bindPhotoAlbum(dialog){
  const gallery=dialog.querySelector("[data-photo-gallery]"),status=dialog.querySelector("[data-photo-album-status]");
  const urls=new Set();
  let generation=0;
  function clear(){
    generation++;
    for(const url of urls)URL.revokeObjectURL(url);
    urls.clear();gallery.replaceChildren();
  }
  dialog.addEventListener("close",clear);
  async function open(){
    if(dialog.open)return;
    clear();
    const visit=generation;
    status.textContent="앨범을 열고 있어요.";
    dialog.showModal();
    try{
      const photos=await listPhotos();
      if(visit!==generation||!dialog.open)return;
      status.textContent=photos.length?`${photos.length}장의 산책 사진`:"사진을 찍으면 이 앨범에 모여요.";
      for(const photo of photos){
        const card=document.createElement("figure"),image=document.createElement("img");
        const caption=document.createElement("figcaption"),button=document.createElement("button");
        const url=URL.createObjectURL(photo.blob);urls.add(url);
        image.src=url;image.loading="lazy";image.alt=photo.place;
        caption.textContent=`${photo.place} · ${photoDate.format(photo.date)}`;
        button.type="button";button.className="quiet";button.textContent="사진 저장";
        button.addEventListener("click",()=>downloadPhoto(photo));
        card.append(image,caption,button);gallery.append(card);
      }
    }catch{
      if(visit===generation)status.textContent="앨범을 열지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
    }
  }
  return {open};
}
