import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const revalidate=60;
export async function GET(request:Request){
 const {searchParams}=new URL(request.url);
 const type=searchParams.get("type");
 const allowed=["daily_verse","devotional","featured_scripture","reading_journey","announcement"];
 const supabase=await createClient();
 let query=supabase.from("orpath_content").select("id,content_type,title,body,scripture_reference,payload,publish_at,created_at").eq("status","published").or("publish_at.is.null,publish_at.lte."+new Date().toISOString()).order("publish_at",{ascending:false,nullsFirst:false}).limit(50);
 if(type&&allowed.includes(type))query=query.eq("content_type",type);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:"Published content is temporarily unavailable."},{status:503});
 return NextResponse.json({items:data??[]},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
}
