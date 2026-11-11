import { SeverityNumber } from "@opentelemetry/api-logs";
import { after, NextRequest, NextResponse } from "next/server";
import { loggerProvider, posthogLogger } from "@/instrumentation";

const BASE="https://rest.api.bible/v1";

function flushPostHogLogs() {
 after(async () => {
  if (loggerProvider) await loggerProvider.forceFlush().catch(() => {});
 });
}
export async function GET(request:NextRequest){
 const key=process.env.API_BIBLE_KEY;if(!key)return NextResponse.json({message:"API Bible key is not configured."},{status:503});
 const q=request.nextUrl.searchParams,resource=q.get("resource"),bible=q.get("bibleId"),book=q.get("bookId"),chapter=q.get("chapterId");
 let path="",params=new URLSearchParams();
 if(resource==="bibles"){path="/bibles";if(q.has("language"))params.set("language",q.get("language")!);params.set("include-full-details","true")}
 else if(resource==="books"&&bible)path=`/bibles/${encodeURIComponent(bible)}/books`;
 else if(resource==="chapters"&&bible&&book)path=`/bibles/${encodeURIComponent(bible)}/books/${encodeURIComponent(book)}/chapters`;
 else if(resource==="chapter"&&bible&&chapter){path=`/bibles/${encodeURIComponent(bible)}/chapters/${encodeURIComponent(chapter)}`;params.set("content-type","html");params.set("include-verse-numbers","true")}
 else if(resource==="search"&&bible&&q.get("query")?.trim()){path=`/bibles/${encodeURIComponent(bible)}/search`;params.set("query",q.get("query")!.trim());params.set("limit",q.get("limit")||"20");params.set("sort","relevance")}
 else return NextResponse.json({message:"Invalid Bible request."},{status:400});
 const resourceName=resource??"unknown";
 posthogLogger?.emit({body:"bible_proxy_request_started",severityNumber:SeverityNumber.INFO,attributes:{resource:resourceName}});
 try{const response=await fetch(BASE+path+(params.size?"?"+params:""),{headers:{"api-key":key,Accept:"application/json"},next:{revalidate:["bibles","books","chapters"].includes(resource||"")?3600:300}});const body=await response.json().catch(()=>({}));
 if(!response.ok){const message=response.status===401?"API.Bible rejected the API key. Check the Vercel environment variable.":response.status===403?"Your API.Bible plan does not permit access to this Bible.":response.status===404?"The requested Bible, book, or chapter was not found.":"API.Bible could not complete this request.";posthogLogger?.emit({body:"bible_proxy_request_failed",severityNumber:SeverityNumber.WARN,attributes:{resource:resourceName,upstream_status:response.status}});flushPostHogLogs();return NextResponse.json({message,upstreamStatus:response.status},{status:response.status})}
 posthogLogger?.emit({body:"bible_proxy_request_completed",severityNumber:SeverityNumber.INFO,attributes:{resource:resourceName,upstream_status:response.status}});flushPostHogLogs();return NextResponse.json(body)}catch{posthogLogger?.emit({body:"bible_proxy_request_failed",severityNumber:SeverityNumber.ERROR,attributes:{resource:resourceName,error_kind:"connection_failed"}});flushPostHogLogs();return NextResponse.json({message:"Could not connect to API.Bible."},{status:502})}
}
