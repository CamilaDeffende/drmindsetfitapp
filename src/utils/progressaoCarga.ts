export function sugestaoCarga(atual:number){
  if(!atual || atual<=0) return atual;
  return Math.round(atual * 1.025);
}
