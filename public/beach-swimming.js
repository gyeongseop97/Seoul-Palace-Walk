// The stroke follows one shared room clock. Hands sweep together, heels recover during
// the pull, then the feet whip closed as the hands extend and the body glides.
const frames=[
 [0,0,0,0,0], [.18,0,0,0,0], [.38,1,.34,.65,.83], [.52,.42,1,1,1],
 [.66,.08,.54,.70,.58], [.79,0,0,.08,.08], [.89,0,0,0,0], [1,0,0,0,0]
];
export const swimwearOptions={
 tide:{name:"청록 래시가드",top:0x207e83,accent:0xe6dca8,shorts:0x214b5b,cut:"rash"},
 coral:{name:"코랄 원피스",top:0xbb575e,accent:0xf8c0a1,shorts:0xbb575e,cut:"suit"},
 navy:{name:"네이비 탱키니·쇼츠",top:0x324f73,accent:0xece7d3,shorts:0x293e56,cut:"tank"}
};
export const swimSeed=p=>((p.id??p.nickname??"").charCodeAt(0)||0)%17/17;
export const swimSpeed=(runBlend=0)=>1.30+.75*runBlend;
export function swimStroke(seconds,moving,seed=0,fast=false,previous=null){
 const rate=moving?(fast?1:.64):.39;
 const phase=previous&&seconds>=previous.at?previous.phase+(seconds-previous.at)*rate:seconds*rate+seed;
 const p=((phase%1)+1)%1;
 if(!moving){
  const scull=(Math.sin(2*Math.PI*p)+1)*.5;
  return {phase:p,at:seconds,sweep:.58+.25*scull,fold:.16+.13*(1-scull),tuck:.40+.17*scull,breath:.80+.12*scull,glide:0,idle:true};
 }
 const i=frames.findIndex((r,i)=>i>0&&r[0]>=p),a=frames[i-1],b=frames[i];
 let u=(p-a[0])/(b[0]-a[0]);u*=u*(3-2*u);
 const get=j=>a[j]+u*(b[j]-a[j]);
 return {phase:p,at:seconds,sweep:get(1),fold:get(2),tuck:get(3),breath:get(4),glide:1-get(2),idle:false};
}
export function breaststroke(model,stroke){
 const {sweep,fold,tuck,breath,idle}=stroke;
 model.body.position.set(0,0,0);
 model.body.rotation.set(idle?.28+.05*breath:1.16-.30*breath,0,0);
 model.pelvis.rotation.set(.01,0,0);model.chest.rotation.set(-.12*breath,0,0);
 model.headJoint.rotation.set(idle?-.19:-.46-.29*breath,0,0);
 for(let i=0;i<2;i++){
  const side=i?1:-1,a=model.arms[i],l=model.legs[i];
  a.upper.rotation.set(idle?-.51-.20*sweep:-2.83+.70*sweep+1.54*fold,side*.15*fold,side*(.075+1.13*sweep));
  a.lower.rotation.set(idle?-.52:-.055-1.37*fold,side*(.27*sweep+.14*fold),-side*.36*fold);
  a.end.rotation.set(.13+.29*sweep,side*.15*sweep,-side*.10);
  l.upper.rotation.set(idle?-.22-.25*tuck:-.07-.42*tuck,side*.22*tuck,side*(.07+.51*tuck));
  l.lower.rotation.set(.085+(idle?.92:1.72)*tuck,-side*.18*tuck,-side*.37*tuck);
  l.end.rotation.set(.24-.73*tuck,side*.28*tuck,side*.075*tuck);
 }
 for(const p of model.itemPivots)p.pivot.visible=false;
 model.tray.visible=false;
}
