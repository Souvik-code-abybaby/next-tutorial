import { tickets } from "../../utils/tickets";
// export  function GET(request){
//     return new Response(JSON.stringify({result:tickets}),{status:200});
// }
import { NextResponse } from "next/server";
export  function GET(){
    return NextResponse.json({result:tickets},{status:200});
}