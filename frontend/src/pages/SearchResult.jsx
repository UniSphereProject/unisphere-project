import { useSearchParams,} from "react-router-dom"
import { useState,useCallback,useRef } from "react";


const SearchResult = () => {
   const searchParams=useSearchParams();
   const q=searchParams.get('q');


  return (
    <div>SearchResult</div>
  )
}

export default SearchResult