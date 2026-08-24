import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const DATA_API_URL = process.env.NEON_DATA_API_URL || 'https://ep-silent-dawn-awkb9bqv.apirest.c-12.us-east-1.aws.neon.tech/neondb/rest/v1';

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const authorization=req.headers.authorization||'';
  if(!authorization.startsWith('Bearer '))return send(res,401,{error:'Authentication required'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const password=String(body.newPassword||'');
    if(password.length<8||password.length>128)return send(res,400,{error:'Password must be between 8 and 128 characters'});
    const salt=randomBytes(16).toString('hex');
    const derived=await scrypt(password.normalize('NFKC'),salt,64,{N:16384,r:16,p:1,maxmem:64*1024*1024});
    const passwordHash=`${salt}:${Buffer.from(derived).toString('hex')}`;
    const response=await fetch(`${DATA_API_URL}/rpc/set_own_password_hash`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':authorization,'Prefer':'return=minimal'},
      body:JSON.stringify({p_password_hash:passwordHash})
    });
    if(!response.ok){
      const error=await response.json().catch(()=>({}));
      return send(res,response.status,{error:error.message||'Password update was rejected'});
    }
    return send(res,200,{ok:true});
  }catch(error){
    return send(res,500,{error:'Could not change password'});
  }
}
