import { tickets } from "../../utils/tickets";
// export  function GET(request){
//     return new Response(JSON.stringify({result:tickets}),{status:200});
// }
import { NextResponse } from "next/server";
export  function POST(request){
    const payload=request.json();
    console.log("paayload",payload)
    return NextResponse.json({result:"ticket added succcessfully"},{status:201});
}