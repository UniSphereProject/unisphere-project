import React from 'react'
 import Information from '../components/Information'
 import noticeData from '../noticeData'
const Notice = () => {
    const notices=noticeData.map((notice)=>(
<Information
key={notice.id}
title={notice.title}
info={notice.info}

 /> )) 
  return (
    <>
  {notices}
    </>
  )
}

export default Notice







      
     
 
