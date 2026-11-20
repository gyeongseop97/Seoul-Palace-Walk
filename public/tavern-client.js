import {tavernMenu} from "./tavern-menu.js";

export function openTavernOrder(submit){
 const dialog=document.getElementById("tavern-menu"),list=document.getElementById("tavern-selection"),
  button=document.getElementById("tavern-submit"),items={};
 list.replaceChildren();button.disabled=true;
 for(const {kind,name,unit} of tavernMenu){
  const row=document.createElement("div"),label=document.createElement("span"),value=document.createElement("output");
  label.textContent=name;value.setAttribute("aria-live","polite");
  row.className="tavern-menu-row";row.append(label);
  const adjust=(text,amount)=>{
   const control=document.createElement("button");control.type="button";control.textContent=text;
   control.setAttribute("aria-label",name+(amount>0?" 추가":" 줄이기"));
   control.onclick=()=>{items[kind]=Math.max(0,Math.min(9,(items[kind]??0)+amount));refresh();};
   row.append(control);return control;
  };
  const minus=adjust("−",-1);row.append(value);const plus=adjust("+",1);
  function refresh(){const n=items[kind]??0;value.textContent=n+unit;minus.disabled=!n;plus.disabled=n===9;button.disabled=!Object.values(items).some(q=>q>0);}
  refresh();list.append(row);
 }
 button.onclick=()=>{dialog.close();submit(items);};
 dialog.showModal();
}
