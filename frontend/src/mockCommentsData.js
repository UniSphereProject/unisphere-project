const mockCommentsData = {
  1: [
    {
      id: "c1_1",
      author: "Siddharth",
      avatarColor: "bg-blue-500",
      content: "For React, I highly recommend starting with the official React Docs (react.dev). Their new interactive tutorials are amazing for understanding state and hooks!",
      timestamp: "2 hours ago",
      votes: 12,
      replies: [
        {
          id: "c1_2",
          author: "Sophie",
          avatarColor: "bg-pink-500",
          content: "Completely agree! The 'Thinking in React' section is a game changer for beginners.",
          timestamp: "1 hour ago",
          votes: 5,
          replies: [
            {
              id: "c1_3",
              author: "Ayush",
              avatarColor: "bg-orange-500",
              content: "Thanks Sophie! I just read that page and it makes building components make so much more sense.",
              timestamp: "45 mins ago",
              votes: 3,
              replies: []
            }
          ]
        },
        {
          id: "c1_4",
          author: "Rohan",
          avatarColor: "bg-emerald-500",
          content: "Also check out freeCodeCamp or Net Ninja on YouTube if you prefer video tutorials.",
          timestamp: "30 mins ago",
          votes: 2,
          replies: []
        }
      ]
    },
    {
      id: "c1_5",
      author: "Ananya",
      avatarColor: "bg-purple-500",
      content: "Don't jump into state management libraries like Redux too early. Stick to standard hooks like useState and useContext first.",
      timestamp: "5 mins ago",
      votes: 1,
      replies: []
    }
  ],
  2: [
    {
      id: "c2_1",
      author: "Daniel",
      avatarColor: "bg-indigo-500",
      content: "Tailwind CSS is definitely my go-to. It keeps the bundle size small and allows rapid UI building directly in the HTML/JSX without jumping back and forth to a stylesheet.",
      timestamp: "3 hours ago",
      votes: 8,
      replies: [
        {
          id: "c2_2",
          author: "Maya",
          avatarColor: "bg-rose-500",
          content: "But don't you find that the class names make the HTML look extremely cluttered?",
          timestamp: "2 hours ago",
          votes: 4,
          replies: [
            {
              id: "c2_3",
              author: "Daniel",
              avatarColor: "bg-indigo-500",
              content: "It does feel cluttered at first, but with component libraries or IDE plugins (like Tailwind CSS IntelliSense), it becomes second nature and highly readable.",
              timestamp: "1 hour ago",
              votes: 6,
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: "c2_4",
      author: "Kiran",
      avatarColor: "bg-amber-500",
      content: "Bootstrap is still great for quick dashboards where you don't care about custom design branding and just need decent-looking widgets out of the box.",
      timestamp: "1 hour ago",
      votes: 2,
      replies: []
    }
  ]
};

export default mockCommentsData;
