import { useEffect, useState } from "react";
import axios from "axios";

export default function Lectures(){

const [lectures,setLectures]=useState([]);

const studentClass="BScCSFY"; // later from logged user



// =======================
// GET EMBED LINK
// =======================

const getEmbedLink=(url)=>{

if(!url) return "";

let videoId="";

try{

// short link

if(url.includes("youtu.be")){

videoId = url.split("youtu.be/")[1]?.split("?")[0];

}

// shorts

else if(url.includes("shorts")){

videoId = url.split("shorts/")[1]?.split("?")[0];

}

// normal watch

else if(url.includes("watch?v=")){

videoId = url.split("v=")[1]?.split("&")[0];

}


// ⭐ LMS EMBED SETTINGS

return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&playsinline=1`;

}
catch{

return "";

}

};



// =======================
// FETCH LECTURES
// =======================

useEffect(()=>{

fetchLectures();

},[]);



const fetchLectures = async()=>{

try{

const res = await axios.get(

`${import.meta.env.VITE_API_URL}/api/lecture/student/${studentClass}`

);

setLectures(res.data);

}
catch(err){

console.log(err);

}

};



return(

<div className="p-8">

<h1 className="text-2xl font-semibold mb-6">

Lectures

</h1>


<div className="grid gap-8">

{

lectures.map((lecture)=>(

<div

key={lecture._id}

className="bg-white rounded-2xl shadow-md p-6 space-y-4"

>

{/* TITLE */}

<h2 className="text-lg font-semibold">

{lecture.title}

</h2>


{/* SUBJECT + FACULTY */}

<div className="flex gap-6 text-sm text-gray-500">

<p>

Subject : {lecture.subject}

</p>

{lecture.facultyName && (

<p>

Faculty : {lecture.facultyName}

</p>

)}

</div>



{/* VIDEO PLAYER */}

<div className="rounded-xl overflow-hidden">

<iframe

loading="lazy"

width="100%"

height="420"

src={getEmbedLink(lecture.youtubeLink)}

allow="accelerometer; autoplay; encrypted-media; picture-in-picture"

allowFullScreen

className="w-full border-0"

/>

</div>

</div>

))

}

</div>

</div>

);

}