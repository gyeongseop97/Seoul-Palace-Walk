import {boatBank,boatPose,canCatchBoat,paperColors} from "./paper-boats.js";

export function bindPaperBoats({getSession,getPlayer,clock,request,token,resetInput,toast,setActivity}){
  const button=id=>document.getElementById(id);
  const dialog=button("boat-dialog"),form=button("boat-form"),letter=button("boat-letter"),note=button("boat-note");
  let boats=[],nextPoll=0,listInFlight=false,busy=false,revision=0,draft=null;
  const target=()=>boats.filter(b=>canCatchBoat(getPlayer(),b,clock())).sort((a,b)=>{
    const p=getPlayer(),distance=b=>{const at=boatPose(b,clock());return Math.hypot(p.x-at.x,p.y-at.y);};
    return distance(a)-distance(b);
  })[0];
  async function exchange(command){
    const visit=getSession(),version=++revision;
    if(!visit)return;
    const reply=await request("/api/room",{room:visit.room,id:visit.id,key:visit.key,paperBoat:command});
    const data=await reply.json();
    if(getSession()!==visit||version!==revision)return;
    if(!reply.ok)throw Error(data.error||"종이배를 확인하지 못했어요.");
    boats=data.boats;return data;
  }
  function poll(){
    const visit=getSession();listInFlight=true;
    exchange({action:"list"}).catch(()=>{}).finally(()=>{if(getSession()===visit)listInFlight=false;});
  }
  button("boat-fold").addEventListener("click",()=>{
    if(busy||!boatBank(getPlayer()))return;
    resetInput();draft=token();form.reset();button("boat-feedback").textContent="";
    button("boat-title").textContent="종이배 접기";form.hidden=false;letter.hidden=true;dialog.showModal();
  });
  async function act(command){
    if(busy)return;
    const visit=getSession();busy=true;button("boat-send").disabled=true;
    try{
      const data=await exchange(command);
      if(!data)return;
      if(data.letter){
        const {name,note,color}=data.letter;
        button("boat-title").textContent="건져 올린 종이배";button("boat-author").textContent=name+" 님이 띄운 배";
        button("boat-message").textContent=note||"쪽지가 없는 종이배예요.";
        letter.style.setProperty("--paper","#"+paperColors[color].toString(16).padStart(6,"0"));
        form.hidden=true;letter.hidden=false;resetInput();if(!dialog.open)dialog.showModal();
      }else{dialog.close();toast("종이배를 띄웠어요. 물가를 따라가며 건질 수 있어요.");}
    }catch(error){
      if(getSession()!==visit)return;
      const message=error instanceof TypeError||error.name==="TimeoutError"?"연결을 확인하고 다시 눌러 주세요.":error.message;
      if(dialog.open&&!form.hidden)button("boat-feedback").textContent=message;else toast(message);
    }finally{if(getSession()===visit){busy=false;button("boat-send").disabled=false;nextPoll=0;}}
  }
  form.addEventListener("submit",event=>{
    event.preventDefault();if(draft)act({action:"launch",boatId:draft,color:form.elements.paper.value,note:note.value.normalize("NFC").trim().replace(/\s+/gu," ")});
  });
  button("boat-catch").addEventListener("click",()=>{
    const id=button("boat-catch").dataset.actionTarget;
    if(boats.some(b=>b.id===id&&canCatchBoat(getPlayer(),b,clock())))act({action:"catch",boatId:id});
  });
  return {
    update(eligible){
      const p=getPlayer(),time=clock();
      const onStream=p.x>=610&&p.x<=1070&&p.y>=-200&&p.y<=-65;
      if(onStream&&time>=nextPoll&&!busy&&!listInFlight&&!document.hidden){nextPoll=time+1800;poll();}
      const bank=eligible&&onStream&&boatBank(p);
      const mine=bank&&boats.some(b=>b.owner===getSession()?.id&&b.expires>time);
      setActivity("boat-fold",bank&&bank.x<1052&&!mine?"종이배 접기":null,busy);
      const near=bank&&target();
      if(near)button("boat-catch").dataset.actionTarget=near.id;
      setActivity("boat-catch",near?"종이배 건지기":null,busy);
    },
    states:()=>boats,
    reset(){revision++;boats=[];draft=null;busy=listInFlight=false;nextPoll=0;button("boat-send").disabled=false;if(dialog.open)dialog.close();}
  };
}
