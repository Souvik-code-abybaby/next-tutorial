import { tickets } from "../../../utils/tickets";
import { NextResponse } from "next/server";

import { use } from "react";
export async function GET(request,content){
    const userId=(await  content.params).params;
    console.log(userId[1],userId[0]);
    const userList=tickets.filter((item)=>{
        return (item.id===userId[1] && item.location===userId[0]);
    })

    return NextResponse.json({result:userList},{status:200});
}