import {diningVenue} from "./dining-data.js";

export function bindDiningMenu({onSelectDish}){
  const dialog=document.getElementById("dining-menu-dialog");
  const options=document.getElementById("dining-menu-options");
  const status=document.getElementById("dining-menu-status");
  const heading=dialog.querySelector("h2");
  function dishOption({kind,name,description,source}){
    const button=document.createElement("button");
    button.type="button";button.className="quiet dining-dish";
    const dishName=document.createElement("strong"),info=document.createElement("span");
    dishName.textContent=name;info.textContent=description;
    button.append(dishName,info);options.append(button);
    button.addEventListener("click",()=>{
      const result=onSelectDish(kind);
      if(result===true){dialog.close();return;}
      status.textContent=typeof result==="string"?result:"지금은 음식을 받을 수 없어요.";
    });
    if(source){
      const link=document.createElement("a");
      link.href=source;link.target="_blank";link.rel="noopener noreferrer";
      link.textContent="이 동네의 음식 이야기 ↗";options.append(link);
    }
  }
  return {
    open(venue=diningVenue){
      heading.textContent=venue.name+" 메뉴";
      options.replaceChildren();
      venue.dishes.forEach(dishOption);
      status.textContent="";
      if(!dialog.open)dialog.showModal();
    },
    close(){if(dialog.open)dialog.close();}
  };
}
