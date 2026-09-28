import { supabase,ensureHouseholdAuth } from '../core/supabase.js';

const PIN_SESSION_KEY = 'household-os:pin-unlocked';

function pinScreen(title, message, mode){
  document.getElementById('app').innerHTML=`<div class="container auth"><section class="card authbox"><div style="font-size:48px">💰</div><h1>家計簿OS</h1><p class="muted">${message}</p><label>4桁PIN</label><input id="household-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="one-time-code" style="font-size:28px;text-align:center;letter-spacing:8px"><button class="primary" style="width:100%;margin-top:12px" id="pin-submit">${title}</button><p id="auth-error" class="small"></p></section></div>`;
  const input=document.getElementById('household-pin');
  const submit=document.getElementById('pin-submit');
  const error=document.getElementById('auth-error');
  input.focus();
  const run=async()=>{
    const pin=input.value.replace(/\D/g,'');
    input.value=pin;
    if(!/^\d{4}$/.test(pin)){error.textContent='4桁の数字を入力してください。';return;}
    submit.disabled=true;error.textContent='';
    try{
      await ensureHouseholdAuth();
      if(mode==='setup'){
        const {data,error:rpcError}=await supabase.rpc('set_household_pin',{p_pin:pin});
        if(rpcError)throw rpcError;
        if(!data)throw new Error('PINの設定に失敗しました。');
      }else{
        const {data,error:rpcError}=await supabase.rpc('verify_household_pin',{p_pin:pin});
        if(rpcError)throw rpcError;
        if(!data)throw new Error('PINが違います。');
      }
      localStorage.setItem(PIN_SESSION_KEY,'1');
      window.dispatchEvent(new CustomEvent('household:unlocked'));
    }catch(e){error.textContent=e.message||'認証に失敗しました。';submit.disabled=false;input.select();}
  };
  submit.onclick=run;
  input.addEventListener('keydown',e=>{if(e.key==='Enter')run()});
}

export async function renderLogin(){
  try{
    await ensureHouseholdAuth();
    const {data,error}=await supabase.rpc('household_pin_configured');
    if(error)throw error;
    pinScreen(data?'開く':'PINを設定','4桁PINで家計簿を保護しています。',data?'verify':'setup');
  }catch(e){
    document.getElementById('app').innerHTML=`<div class="container auth"><section class="card authbox"><h1>家計簿OS</h1><p class="small">初期化に失敗しました。</p><p class="small">${e.message||''}</p></section></div>`;
  }
}

export function clearPinSession(){try{localStorage.removeItem(PIN_SESSION_KEY)}catch(_){} }
export function isPinUnlocked(){try{return localStorage.getItem(PIN_SESSION_KEY)==='1'}catch{return false}}
