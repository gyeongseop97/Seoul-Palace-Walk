import {diningMenu} from "./dining-data.js";

export function bindDiningMenu({onSelectDish}){
  const dialog=document.getElementById("dining-menu-dialog");
  const options=document.getElementById("dining-menu-options");
  const status=document.getElementById("dining-menu-status");
  for(const {kind,name,description} of diningMenu){
    const button=document.createElement("button");
    button.type="button";button.className="quiet dining-dish";
    const title=document.createElement("strong"),info=document.createElement("span");
    title.textContent=name;info.textContent=description;
    button.append(title,info);options.append(button);
    button.addEventListener("click",()=>{
      const result=onSelectDish(kind);
      if(result===true){dialog.close();return;}
      status.textContent=typeof result==="string"?result:"지금은 음식을 받을 수 없어요.";
    });
  }
  return {
    open(){
      status.textContent="";
      if(!dialog.open)dialog.showModal();
    },
    close(){if(dialog.open)dialog.close();}
  };
}
