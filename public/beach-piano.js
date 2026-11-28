const whiteNotes=[0,2,4,5,7,9,11];
const noteNames=["도","도♯","레","레♯","미","파","파♯","솔","솔♯","라","라♯","시"];
const keyboard=["KeyA","KeyW","KeyS","KeyE","KeyD","KeyF","KeyT","KeyG","KeyY","KeyH","KeyU","KeyJ","KeyK"];

export function createBeachPiano(dialog,sound){
  const keys=dialog.querySelector(".piano-keys");
  const octaveLabel=dialog.querySelector("output");
  const lower=dialog.querySelector("[data-octave='-1']");
  const higher=dialog.querySelector("[data-octave='1']");
  const pedal=dialog.querySelector(".piano-pedal");
  const held=new Map(),voices=new Map(),buttons=new Map();
  let octave=4,pedalOn=false;

  function stop(note,voice){
    voice.release?.();
    voices.delete(note);
  }
  function press(source,note,velocity){
    if(held.has(source))return;
    held.set(source,note);
    const current=voices.get(note);
    if(current?.count){current.count++;return;}
    if(current)stop(note,current);
    voices.set(note,{count:1,release:sound.pianoNote(note,velocity)});
    buttons.get(note)?.classList.add("sounding");
  }
  function release(source){
    const note=held.get(source);
    if(note===undefined)return;
    held.delete(source);
    const voice=voices.get(note);
    if(--voice.count>0)return;
    buttons.get(note)?.classList.remove("sounding");
    if(!pedalOn)stop(note,voice);
  }
  function sustain(enabled){
    pedalOn=enabled;
    pedal.setAttribute("aria-pressed",String(enabled));
    if(!enabled)for(const [note,voice] of voices)if(!voice.count)stop(note,voice);
  }
  function reset(){
    sustain(false);
    for(const source of held.keys())release(source);
  }
  function addKey(note,position,black){
    const button=document.createElement("button");
    const name=noteNames[note%12]+(Math.floor(note/12)-1);
    const hotkey=keyboard[note-(octave+1)*12]?.at(-1);
    button.type="button";
    button.tabIndex=-1;
    button.className=black?"piano-black":"piano-white";
    button.style.setProperty("--key-position",position);
    button.setAttribute("aria-label",name+(hotkey?" "+hotkey:""));
    button.textContent=hotkey??"";
    button.addEventListener("pointerdown",event=>{
      if(event.button!==0)return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      press(event.pointerId,note,event.pressure>0?.65+event.pressure*.3:.8);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"]){
      button.addEventListener(type,event=>release(event.pointerId));
    }
    keys.append(button);
    buttons.set(note,button);
  }
  function render(){
    reset();
    buttons.clear();
    keys.replaceChildren();
    const start=12*octave;
    for(let index=0;index<21;index++){
      const note=start+12*Math.floor(index/7)+whiteNotes[index%7];
      if(note>=21&&note<=108)addKey(note,index,false);
      if(index<20&&![2,6].includes(index%7)&&note+1>=21&&note+1<=108)addKey(note+1,index+.69,true);
    }
    lower.disabled=octave===1;
    higher.disabled=octave===7;
    octaveLabel.value="도"+octave;
  }
  function shift(delta){
    octave=Math.max(1,Math.min(7,octave+delta));
    render();
  }
  lower.addEventListener("click",()=>shift(-1));
  higher.addEventListener("click",()=>shift(1));
  pedal.addEventListener("click",()=>sustain(!pedalOn));
  dialog.addEventListener("keydown",event=>{
    if(event.ctrlKey||event.altKey||event.metaKey)return;
    const index=keyboard.indexOf(event.code);
    if(index>=0){
      event.preventDefault();
      event.stopPropagation();
      const note=(octave+1)*12+index;
      if(!event.repeat&&note<=108)press(event.code,note,.85);
    }else if(event.code==="Space"&&event.target.tagName!=="BUTTON"){
      event.preventDefault();
      event.stopPropagation();
      if(!event.repeat)sustain(!pedalOn);
    }
  });
  dialog.addEventListener("keyup",event=>release(event.code));
  dialog.addEventListener("close",reset);
  window.addEventListener("blur",reset);
  render();
  return {open:()=>{
    sound.preparePiano();
    dialog.querySelector(".piano-muted").hidden=sound.enabled;
    dialog.showModal();
  }};
}
