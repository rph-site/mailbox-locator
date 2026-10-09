/* Blue Boxes mailbox feed. The Airtable token belongs in a Cloudflare secret. */
const BASE_ID = "appFUVid8cEGQvoaD";
const TABLE_ID = "tbl0a1FHvC7meUYmG";
const CACHE_SECONDS = 300;
const FIELDS = {
  name:"fldG9vpEPrfzZIgV5",address:"fldxUb1uXZ5jpoDVf",latitude:"fldAC6vo0FNZzN3YO",longitude:"fldgqc7Pc04JqpsmT",notes:"fldTD80RlK55xDCBu",active:"fldZM3Ht2zSBjjXdB",
  mon:"fldkpBKeRJJ0Vf3qV",tue:"fldGiQ93uBaW29w6Y",wed:"fldwAkmDMcLDCYTyF",thu:"fldmKHi4k04qsCzjT",fri:"fldRWfbpRZGJCEkLU",sat:"fldxpVssS41uXdTe2",sun:"fldFSyUcFlsypzdmj"
};
const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
export function normalizePickup(value){
  if(value===undefined||value===null||String(value).trim()==="")return null;
  const text=String(value).trim();
  if(/^([01]\d|2[0-3]):[0-5]\d$/.test(text))return text;
  const match=text.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)$/i);
  if(!match||Number(match[1])<1||Number(match[1])>12)throw new Error("Invalid pickup time");
  const hour=Number(match[1])%12+(match[3].toUpperCase()==="PM"?12:0);
  return String(hour).padStart(2,"0")+":"+(match[2]||"00");
}
export function convertRecords(records){
  const mailboxes=[];let skipped=0;
  for(const record of records){
    const f=record.fields||{};if(f[FIELDS.active]!==true)continue;
    try{
      const latitude=f[FIELDS.latitude],longitude=f[FIELDS.longitude];
      if(typeof f[FIELDS.name]!=="string"||!f[FIELDS.name].trim()||typeof f[FIELDS.address]!=="string"||!f[FIELDS.address].trim()||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new Error("Incomplete mailbox");
      const pickups=Object.fromEntries(DAYS.map(day=>[day,normalizePickup(f[FIELDS[day]])]));
      mailboxes.push({id:record.id,name:f[FIELDS.name].trim(),address:f[FIELDS.address].trim(),latitude,longitude,pickups,notes:typeof f[FIELDS.notes]==="string"?f[FIELDS.notes]:""});
    }catch{skipped++;}
  }
  mailboxes.sort((a,b)=>a.name.localeCompare(b.name));
  return {mailboxes,skipped};
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
function cors(response,origin){const headers=new Headers(response.headers);headers.set("Access-Control-Allow-Origin",origin);headers.set("Access-Control-Allow-Methods","GET, OPTIONS");headers.set("Access-Control-Allow-Headers","Content-Type");headers.set("Vary","Origin");headers.set("Cache-Control","no-store");return new Response(response.body,{status:response.status,headers});}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url),allowed=String(env.ALLOWED_ORIGIN||"*").trim();
    const origin=request.headers.get("Origin");
    /* These are public mailbox locations. CORS is a browser restriction, not authentication. */
    if(origin&&allowed!=="*"&&origin!==allowed)return json({error:"This website is not allowed. Check ALLOWED_ORIGIN in Cloudflare."},403);
    const respond=(data,status=200)=>cors(json(data,status),allowed);
    if(!["/","/mailboxes","/mailboxes/"].includes(url.pathname))return respond({error:"Use the /mailboxes endpoint."},404);
    if(request.method==="OPTIONS")return cors(new Response(null,{status:204}),allowed);
    if(request.method!=="GET")return respond({error:"Only GET requests are supported."},405);
    if(!env.AIRTABLE_TOKEN)return respond({error:"Setup incomplete. Add AIRTABLE_TOKEN as a Cloudflare secret."},503);
    const cacheKey=new Request(url.origin+"/mailboxes");
    let cache=null;try{cache=caches.default;const hit=await cache.match(cacheKey);if(hit)return cors(hit,allowed);}catch{}
    try{
      const records=[];let offset=null,pages=0;
      do{
        const upstream=new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
        upstream.searchParams.set("pageSize","100");upstream.searchParams.set("returnFieldsByFieldId","true");
        for(const field of Object.values(FIELDS))upstream.searchParams.append("fields[]",field);
        if(offset)upstream.searchParams.set("offset",offset);
        const response=await fetch(upstream,{headers:{Authorization:`Bearer ${env.AIRTABLE_TOKEN}`},signal:AbortSignal.timeout(10000)});
        if(!response.ok){
          const message=response.status===401||response.status===403?"Airtable access failed. Check the token's data.records:read scope and access to the Blue Boxes base.":response.status===429?"Airtable's request limit was reached. Wait and try again.":"Airtable is unavailable. Check that the base and table still exist, then try again.";
          return respond({error:message},response.status===429?429:502);
        }
        const body=await response.json();if(!Array.isArray(body.records))throw new Error("Invalid upstream response");
        records.push(...body.records);offset=body.offset||null;if(++pages>=50&&offset)throw new Error("Too many records");
      }while(offset);
      const result=convertRecords(records);
      const output={source:"Airtable",fetchedAt:new Date().toISOString(),cacheSeconds:CACHE_SECONDS,...result};
      const raw=json(output);const cacheable=raw.clone();cacheable.headers.set("Cache-Control",`public, max-age=${CACHE_SECONDS}`);
      if(cache){try{ctx.waitUntil(cache.put(cacheKey,cacheable).catch(()=>{}));}catch{}}
      return cors(raw,allowed);
    }catch{return respond({error:"Mailbox data could not load. Check the connection and try again."},502);}
  }
};
