import {cleanGuestbookMessage,GUESTBOOK_LIMIT,guestbookVenues} from "./guestbook-data.js";
import {gameApiUrl,isGitHubPages} from "./hosting.js";

const guestbookDate=new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",dateStyle:"medium",timeStyle:"short"});

async function requestGuestbook(endpoint,body){
  const contentType=isGitHubPages()?"text/plain;charset=UTF-8":"application/json";
  return fetch(gameApiUrl(endpoint),{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":contentType},body:JSON.stringify(body),signal:AbortSignal.timeout(4500)});
}

export function bindGuestbook({getSession,onClose,request=requestGuestbook}){
  const style=document.createElement("link");
  style.rel="stylesheet";style.href=new URL("./guestbook.css",import.meta.url);
  document.head.append(style);

  const dialog=document.createElement("dialog");
  dialog.id="guestbook-dialog";
  dialog.setAttribute("aria-labelledby","guestbook-title");
  dialog.setAttribute("data-native-touch","");
  dialog.innerHTML=`
    <header class="dialog-top">
      <h2 id="guestbook-title">방명록</h2>
      <button type="button" class="quiet" data-guestbook-close aria-label="방명록 닫기">닫기</button>
    </header>
    <p class="guestbook-place" data-guestbook-place></p>
    <form>
      <label for="guestbook-message">산책방에 남길 글</label>
      <textarea id="guestbook-message" rows="2" maxlength="${GUESTBOOK_LIMIT*2}" aria-describedby="guestbook-count"></textarea>
      <div class="guestbook-actions">
        <small id="guestbook-count"></small>
        <button type="submit" class="primary">글 남기기</button>
      </div>
    </form>
    <p class="guestbook-status" role="status" data-guestbook-status></p>
    <div class="guestbook-entry-head">
      <h3>방문객이 남긴 글</h3>
      <button type="button" class="quiet" data-guestbook-refresh>새로고침</button>
    </div>
    <ul class="guestbook-entries" aria-label="방명록 글"></ul>
    <button type="button" class="quiet" data-guestbook-more hidden>이전 글 보기</button>`;
  document.body.append(dialog);

  const place=dialog.querySelector("[data-guestbook-place]"),form=dialog.querySelector("form");
  const field=form.querySelector("textarea"),submit=form.querySelector("[type=submit]");
  const count=form.querySelector("small"),list=dialog.querySelector("ul");
  const status=dialog.querySelector("[data-guestbook-status]");
  const refresh=dialog.querySelector("[data-guestbook-refresh]"),more=dialog.querySelector("[data-guestbook-more]");
  let visit;

  function updateControls(){
    const size=[...field.value.normalize("NFC").trim().replace(/\s+/g," ")].length;
    count.textContent=`${size}/${GUESTBOOK_LIMIT}`;
    count.classList.toggle("guestbook-too-long",size>GUESTBOOK_LIMIT);
    submit.disabled=Boolean(!visit||visit.busy||!cleanGuestbookMessage(field.value));
    refresh.disabled=more.disabled=Boolean(visit?.busy);
    field.readOnly=visit?.busy==="post";
    more.hidden=!visit?.next;
  }

  function entryRow(entry){
    const row=document.createElement("li"),heading=document.createElement("div");
    const name=document.createElement("strong"),time=document.createElement("time"),message=document.createElement("p");
    name.textContent=entry.nickname;
    time.dateTime=new Date(entry.created).toISOString();time.textContent=guestbookDate.format(entry.created);
    message.textContent=entry.message;
    heading.append(name,time);row.append(heading,message);
    return row;
  }

  async function load(action,before=null){
    const current=visit;
    if(!current||current.busy)return;
    const {room,id,key}=current.session;
    const payload={action,venue:current.venue};
    if(before)payload.before=before;
    if(action==="post"){
      payload.message=cleanGuestbookMessage(field.value);
      if(!payload.message)return;
      if(current.draft?.message!==payload.message){
        current.draft={message:payload.message,request:crypto.randomUUID().replaceAll("-","")};
      }
      payload.request=current.draft.request;
    }
    current.busy=action;
    status.textContent=action==="post"?"글을 남기는 중이에요.":"방명록을 불러오는 중이에요.";
    updateControls();
    try{
      const response=await request("/api/room",{room,id,key,guestbook:payload});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      if(!Array.isArray(data.entries))throw Error();
      if(visit!==current||!dialog.open)return;
      if(!before)list.replaceChildren();
      list.append(...data.entries.map(entryRow));
      current.next=data.next;
      if(action==="post"){
        field.value="";current.draft=null;
        status.textContent="방명록에 글을 남겼어요.";
      }else status.textContent=list.childElementCount?"":"첫 번째 글을 남겨 보세요.";
    }catch(error){
      if(visit===current&&dialog.open){
        status.textContent=error.message&&/[가-힣]/.test(error.message)?error.message:"방명록 연결을 확인한 뒤 다시 시도해 주세요.";
      }
    }finally{
      if(visit===current){current.busy=null;updateControls();}
    }
  }

  field.addEventListener("input",updateControls);
  form.addEventListener("submit",event=>{event.preventDefault();void load("post");});
  refresh.addEventListener("click",()=>void load("list"));
  more.addEventListener("click",()=>void load("list",visit?.next));
  const closeButton=dialog.querySelector("[data-guestbook-close]");
  closeButton.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{
    if(dialog.open)return;
    const previous=visit;
    visit=null;
    if(previous?.session===getSession())onClose?.();
  });

  return {
    open(venue){
      const session=getSession();
      if(!session||!Object.hasOwn(guestbookVenues,venue)||dialog.open)return;
      visit={session,venue,next:null,busy:null,draft:null};
      place.textContent=guestbookVenues[venue];
      field.value="";list.replaceChildren();status.textContent="";dialog.scrollTop=0;
      dialog.showModal();closeButton.focus({preventScroll:true});
      void load("list");
    },
    close(){if(dialog.open)dialog.close();}
  };
}
