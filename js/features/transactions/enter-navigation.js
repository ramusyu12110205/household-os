export function bindEnterNavigation(){
  const root=document.querySelector('#app');
  if(!root)return;
  root.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.isComposing)return;
    const target=e.target;
    if(!target.matches('input,select'))return;
    if(target.id==='tx-save')return;
    e.preventDefault();
    const fields=[...root.querySelectorAll('input,select')].filter(el=>{
      if(el.disabled||el.readOnly)return false;
      if(el.type==='hidden')return false;
      if(el.offsetParent===null)return false;
      return true;
    });
    const index=fields.indexOf(target);
    if(index<0)return;
    const next=fields[index+1];
    if(next){next.focus();if(next.select&&next.tagName==='INPUT'&&next.type!=='date')next.select();return;}
    document.querySelector('#tx-save')?.click();
  });
}
