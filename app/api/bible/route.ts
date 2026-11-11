import { NextRequest, NextResponse } from "next/server";
const BASE="https://rest.api.bible/v1";
export async function GET(request:NextRequest){
 const key=process.env.API_BIBLE_KEY;if(!key)return NextResponse.json({message:"API Bible key is not configured."},{status:503});
 const q=request.nextUrl.searchParams,resource=q.get("resource"),bible=q.get("bibleId"),book=q.get("bookId"),chapter=q.get("chapterId");
 let path="";const params=new URLSearchParams();
 if(resource==="bibles"){path="/bibles";if(q.has("language"))params.set("language",q.get("language")!);params.set("include-full-details","true")}
 else if(resource==="books"&&bible)path=`/bibles/${encodeURIComponent(bible)}/books`;
 else if(resource==="chapters"&&bible&&book)path=`/bibles/${encodeURIComponent(bible)}/books/${encodeURIComponent(book)}/chapters`;
 else if(resource==="chapter"&&bible&&chapter){path=`/bibles/${encodeURIComponent(bible)}/chapters/${encodeURIComponent(chapter)}`;params.set("content-type","html");params.set("include-verse-numbers","true")}
 else if(resource==="search"&&bible&&q.get("query")?.trim()){path=`/bibles/${encodeURIComponent(bible)}/search`;params.set("query",q.get("query")!.trim());params.set("limit",q.get("limit")||"20");params.set("sort","relevance")}
 else if(resource==="audio-bibles"){path="/audio-bibles";if(q.has("language"))params.set("language",q.get("language")!);}
 else if(resource==="audio-books"&&bible){path=`/audio-bibles/${encodeURIComponent(bible)}/books`;if(q.get("includeChapters")==="true")params.set("include-chapters","true");}
 else if(resource==="audio-chapter"&&bible&&chapter){path=`/audio-bibles/${encodeURIComponent(bible)}/chapters/${encodeURIComponent(chapter)}`;}
 else return NextResponse.json({message:"Invalid Bible request."},{status:400});
 try{const response=await fetch(BASE+path+(params.size?"?"+params:""),{headers:{"api-key":key,Accept:"application/json"},next:{revalidate:["bibles","books","chapters"].includes(resource||"")?3600:300}});const body=await response.json().catch(()=>({}));
 if(!response.ok){const message=response.status===401?"API.Bible rejected the API key. Check the Vercel environment variable.":response.status===403?"Your API.Bible plan does not permit access to this Bible.":response.status===404?"The requested Bible, book, or chapter was not found.":"API.Bible could not complete this request.";return NextResponse.json({message,upstreamStatus:response.status},{status:response.status})}
 return NextResponse.json(body)}catch{return NextResponse.json({message:"Could not connect to API.Bible."},{status:502})}
}
