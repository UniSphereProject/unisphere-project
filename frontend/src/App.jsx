import { Routes,Route} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Forgetpw from "./pages/Forgetpw";
import Register from "./pages/Register";
import Notice from "./pages/Notice";
const App=()=>{
  return(
   
     <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/home" element={<Home/>} />
      <Route path='/forgetpw' element={<Forgetpw/>}/>
      <Route path="/register" element={<Register/>} />
      <Route path="/notice" element={<Notice/>} />

    </Routes>
   
   
  )
}
export default App;