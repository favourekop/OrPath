import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Published content feed is not configured."},{status:503});
 const type=request.nextUrl.searchParams.get("type");
 const allowed=["daily_verse","devotional","featured_scripture","reading_journey","announcement"];
 if(type&&!allowed.includes(type))return NextResponse.json({error:"Invalid content type."},{status:400});
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const now=new Date().toISOString();
 let query=db.from("orpath_content").select("id,content_type,title,body,scripture_reference,payload,publish_at,created_at").eq("status","published").or(`publish_at.is.null,publish_at.lte.${now}`).order("publish_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).limit(50);
 if(type)query=query.eq("content_type",type);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:"Published content is temporarily unavailable."},{status:503});
 return NextResponse.json({items:data??[]},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
}
