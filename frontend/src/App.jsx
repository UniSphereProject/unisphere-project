import { Routes,Route} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Forgetpw from "./pages/Forgetpw";
import Register from "./pages/Register";
import Notice from "./pages/Notice";
import Notes from "./pages/Notes";
import Tryregister from "./pages/Register";
const App=()=>{
  return(
   
     <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/home" element={<Home/>} />
      <Route path='/forgetpw' element={<Forgetpw/>}/>
      <Route path="/register" element={<Tryregister/>} />
      <Route path="/notice" element={<Notice/>} />
       <Route path="/notes" element={<Notes/>} />

    </Routes>
   
   
  )
}
export default App;