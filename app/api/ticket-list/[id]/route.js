import { tickets } from "../../../utils/tickets";
import { NextResponse } from "next/server";

import { use } from "react";
export async function GET(request,content){
    const userId=(await  content.params).id
    console.log(userId);
    const userList=tickets.filter((item)=>{
        return item.id===userId;
    })

    return NextResponse.json({result:userList},{status:200});
}