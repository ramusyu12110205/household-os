import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});

export async function ensureHouseholdAuth(){
  const {data,error}=await supabase.auth.getSession();
  if(error)throw error;
  if(data?.session)return data.session;
  const {data:anonData,error:anonError}=await supabase.auth.signInAnonymously();
  if(anonError)throw anonError;
  if(!anonData?.session)throw new Error('家計簿用の認証セッションを作成できませんでした。');
  return anonData.session;
}

export async function clearHouseholdAuth(){
  const {error}=await supabase.auth.signOut();
  if(error)throw error;
}
