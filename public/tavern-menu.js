export const tavernMenu=[
 {kind:"soju",name:"소주",unit:"병",servings:4},
 {kind:"sashimi",name:"모둠회",unit:"접시",servings:3},
 {kind:"grilledClam",name:"조개구이",unit:"바구니",servings:3}
];
export function validTavernOrder(items){
 if(!items||typeof items!=="object"||Array.isArray(items))return false;
 const known=tavernMenu.map(d=>d.kind);
 return Object.entries(items).every(([k,n])=>known.includes(k)&&Number.isInteger(n)&&n>=0&&n<=9)&&
   known.some(k=>items[k]>0);
}
