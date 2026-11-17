import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
async function authorize() {
 const session=await createClient();
 const {data:{user}}=await session.auth.getUser();
 if(!user)return {error:NextResponse.json({error:"Sign in required."},{status:401})};
 const {data:profile}=await session.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")return {error:NextResponse.json({error:"Admin access required."},{status:403})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {error:NextResponse.json({error:"CMS database access is not configured. Check SUPABASE_SERVICE_ROLE_KEY."},{status:503})};
 return {user,db:createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})};
}
const types=["daily_verse","devotional","featured_scripture","reading_journey","announcement"];
const statuses=["draft","published","archived"];
export async function GET(){
 const auth=await authorize();if("error" in auth)return auth.error;
 const {data,error}=await auth.db.from("orpath_content").select("*").order("updated_at",{ascending:false}).limit(250);
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({items:data??[]});
}
export async function POST(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>({}));
 if(!types.includes(body.content_type)||typeof body.title!=="string"||!body.title.trim())return NextResponse.json({error:"Choose a content type and enter a title."},{status:400});
 const row={content_type:body.content_type,title:body.title.trim(),body:typeof body.body==="string"?body.body:"",scripture_reference:typeof body.scripture_reference==="string"?body.scripture_reference:null,payload:body.payload&&typeof body.payload==="object"?body.payload:{},status:statuses.includes(body.status)?body.status:"draft",publish_at:body.publish_at||null,created_by:auth.user.id,updated_at:new Date().toISOString()};
 const {data,error}=await auth.db.from("orpath_content").insert(row).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({item:data},{status:201});
}
export async function PATCH(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>({}));
 if(typeof body.id!=="string")return NextResponse.json({error:"Content ID is required."},{status:400});
 const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
 if(typeof body.content_type==="string"&&types.includes(body.content_type))patch.content_type=body.content_type;
 if(typeof body.title==="string"&&body.title.trim())patch.title=body.title.trim();
 if(typeof body.body==="string")patch.body=body.body;
 if(typeof body.scripture_reference==="string"||body.scripture_reference===null)patch.scripture_reference=body.scripture_reference;
 if(body.payload&&typeof body.payload==="object")patch.payload=body.payload;
 if(typeof body.status==="string"&&statuses.includes(body.status))patch.status=body.status;
 if(body.publish_at===null||typeof body.publish_at==="string")patch.publish_at=body.publish_at;
 const {data,error}=await auth.db.from("orpath_content").update(patch).eq("id",body.id).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({item:data});
}
export async function DELETE(request:Request){
 const auth=await authorize();if("error" in auth)return auth.error;
 const body=await request.json().catch(()=>({}));
 if(typeof body.id!=="string")return NextResponse.json({error:"Content ID is required."},{status:400});
 const {error}=await auth.db.from("orpath_content").delete().eq("id",body.id);
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({ok:true});
}
