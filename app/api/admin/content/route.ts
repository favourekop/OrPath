import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
const types=["daily_verse","devotional","featured_scripture","reading_journey","announcement"];
const statuses=["draft","published","archived"];
async function authorize() {
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return {error:NextResponse.json({error:"Sign in required."},{status:401})};
 const {data:profile,error:profileError}=await session.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profileError)return {error:NextResponse.json({error:"Could not verify administrator access."},{status:500})};
 if(profile?.role!=="admin")return {error:NextResponse.json({error:"Admin access required."},{status:403})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {error:NextResponse.json({error:"CMS database access is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables."},{status:503})};
 return {user,db:createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})};
}
function validPublishAt(value:unknown):string|null|undefined{
 if(value===undefined)return undefined;
 if(value===null||value==="")return null;
 if(typeof value!=="string"||Number.isNaN(Date.parse(value)))return undefined;
 return new Date(value).toISOString();
}
export async function GET(){
 const auth=await authorize();if("error" in auth)return auth.error;
 const {data,error}=await auth.db.from("orpath_content").select("id,content_type,title,body,scripture_reference,payload,status,publish_at,created_at,updated_at").order("updated_at",{ascending:false}).limit(250);
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({items:data??[]});
}
export async function POST(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>null);
 if(!body||!types.includes(body.content_type)||typeof body.title!=="string"||!body.title.trim())return NextResponse.json({error:"Choose a content type and enter a title."},{status:400});
 if(body.title.trim().length>180)return NextResponse.json({error:"Titles must be 180 characters or fewer."},{status:400});
 const publishAt=validPublishAt(body.publish_at);
 if(body.publish_at!==undefined&&publishAt===undefined)return NextResponse.json({error:"Enter a valid publication date and time."},{status:400});
 const row={content_type:body.content_type,title:body.title.trim(),body:typeof body.body==="string"?body.body:"",scripture_reference:typeof body.scripture_reference==="string"?body.scripture_reference:null,payload:body.payload&&typeof body.payload==="object"&&!Array.isArray(body.payload)?body.payload:{},status:statuses.includes(body.status)?body.status:"draft",publish_at:publishAt??null,created_by:auth.user.id,updated_at:new Date().toISOString()};
 const {data,error}=await auth.db.from("orpath_content").insert(row).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({item:data},{status:201});
}
export async function PATCH(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=="string")return NextResponse.json({error:"Content ID is required."},{status:400});
 const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
 if(typeof body.content_type==="string"){if(!types.includes(body.content_type))return NextResponse.json({error:"Invalid content type."},{status:400});patch.content_type=body.content_type;}
 if(typeof body.title==="string"){if(!body.title.trim()||body.title.trim().length>180)return NextResponse.json({error:"Enter a title of 1–180 characters."},{status:400});patch.title=body.title.trim();}
 if(typeof body.body==="string")patch.body=body.body;
 if(typeof body.scripture_reference==="string"||body.scripture_reference===null)patch.scripture_reference=body.scripture_reference;
 if(body.payload&&typeof body.payload==="object"&&!Array.isArray(body.payload))patch.payload=body.payload;
 if(typeof body.status==="string"){if(!statuses.includes(body.status))return NextResponse.json({error:"Invalid publication status."},{status:400});patch.status=body.status;}
 if(body.publish_at!==undefined){const publishAt=validPublishAt(body.publish_at);if(publishAt===undefined)return NextResponse.json({error:"Enter a valid publication date and time."},{status:400});patch.publish_at=publishAt;}
 const {data,error}=await auth.db.from("orpath_content").update(patch).eq("id",body.id).select("*").maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});
 if(!data)return NextResponse.json({error:"Content entry not found."},{status:404});
 return NextResponse.json({item:data});
}
export async function DELETE(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=="string")return NextResponse.json({error:"Content ID is required."},{status:400});
 const {data,error}=await auth.db.from("orpath_content").delete().eq("id",body.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});
 if(!data)return NextResponse.json({error:"Content entry not found."},{status:404});
 return NextResponse.json({ok:true});
}
