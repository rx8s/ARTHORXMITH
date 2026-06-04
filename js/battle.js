
export function stats(c){
 return {
  hp:c.vit*20+c.str*2,
  atk:c.str*2,
  def:c.vit
 };
}
export function battle(a,d){
 const sa=stats(a), sd=stats(d);
 return Math.max(1,sa.atk-sd.def);
}
