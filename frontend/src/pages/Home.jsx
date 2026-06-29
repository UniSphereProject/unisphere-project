import React from "react";
import discussionData from "../discussionData";
import Discussion from "../components/Discussion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TrendingSection from "./TrendingSection";

const Home = () => {
  const display = discussionData.map((post) => (
    <Discussion
      key={post.id}
      id={post.id}
      user={post.user}
      title={post.title}
      content={post.content}
      imageurl={post.imageurl}
    />
  ));

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />

        <main className="flex-1 px-4">
          {display}
        </main>

        <aside className="w-80 mr-4 hidden lg:block">
          <div className="sticky top-20">
            <TrendingSection />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;