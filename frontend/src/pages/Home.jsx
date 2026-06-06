import React from "react";
import discussionData from "../discussionData";
import noticeData from '../noticeData'
import Discussion from "../components/Discussion";
import Navbar from "../components/Navbar";
import  Sidebar from "../components/Sidebar";


const Home = () => {
  const display = discussionData.map((post) => (
    <Discussion
      key={post.id}
      user={post.user}
      title={post.title}
      content={post.content}
      imageurl={post.imageurl}
    />
  ));

 

  return (
    <>
      <div className="bg-slate-100 min-h-screen m-0 py-2">
         <Navbar/>
        <div className="flex "> 
         
        <Sidebar/>
         <div className="mt-16 flex-1"> {display}</div>
        </div>
       
       
       
        </div>
    </>
  );
};

export default Home;
