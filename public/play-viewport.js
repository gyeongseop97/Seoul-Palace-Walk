export function bindPlayViewport(shell,chatInput,mobile){
  const viewport=window.visualViewport;
  if(!viewport)return;
  let width=0,expandedHeight=0,chatKeyboard=false,frame=0;
  function layout(){
    frame=0;
    if(!mobile.matches||Math.abs(viewport.scale-1)>.01){
      shell.style.removeProperty("--play-visible-height");
      shell.style.removeProperty("--play-visible-top");
      shell.removeAttribute("data-chat-keyboard");
      width=0;chatKeyboard=false;
      return;
    }
    const height=Math.round(viewport.height),currentWidth=Math.round(viewport.width);
    const editing=document.activeElement===chatInput;
    if(currentWidth!==width){
      width=currentWidth;
      expandedHeight=Math.max(height,window.innerHeight);
    }
    if(!editing&&!chatKeyboard)expandedHeight=height;
    expandedHeight=Math.max(expandedHeight,height);
    // Browser bars can change the height by a few dozen pixels. A keyboard
    // takes a much larger share and can stay up briefly after chat loses focus.
    chatKeyboard=(editing||chatKeyboard)&&expandedHeight-height>Math.max(105,expandedHeight*.18);
    shell.toggleAttribute("data-chat-keyboard",chatKeyboard);
    shell.style.setProperty("--play-visible-height",height+"px");
    shell.style.setProperty("--play-visible-top",Math.round(viewport.offsetTop)+"px");
  }
  function queue(){if(!frame)frame=requestAnimationFrame(layout);}
  viewport.addEventListener("resize",queue);
  viewport.addEventListener("scroll",queue);
  window.addEventListener("resize",queue);
  window.addEventListener("pageshow",queue);
  chatInput.addEventListener("focus",queue);
  chatInput.addEventListener("blur",queue);
  mobile.addEventListener("change",queue);
  layout();
}
