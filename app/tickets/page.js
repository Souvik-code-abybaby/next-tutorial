"use client"

import { useState } from "react";

 
export default function TicketPage(){
    const [ticketList,setTicketList]=useState();
    const [name,setName]=useState("");
    const [message,setMessage]=useState("");
   async function  handleShowdata() {
        const getData=await fetch("http://localhost:3000/api/ticket-list")
        const jsonData=await getData.json();
        console.log(jsonData)
        setTicketList(jsonData.result);
        
    }
       async function  handleSubmit() {
        const getData=await fetch("http://localhost:3000/api/ticket-add",{method:"POST",body:JSON.stringify({name:name})})
        const jsonData=await getData.json();
        console.log(jsonData)
        setMessage(jsonData.result); 
        
    }
    console.log(name)
    return(
        <> <h1>Ticket List</h1>
        <button onClick={handleShowdata}>Click</button>
        {
            ticketList?.map((item)=>{
                return <p key={item.id}>{item.name}</p>
            })
        }
        <input type="text" name="name" onChange={(e)=>setName(e.target.value)} value={name}/>
        <button onClick={handleSubmit}>Submit</button>
        
        </>

       

    )
}