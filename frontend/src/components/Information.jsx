  import React from 'react'
  
  const Information = (props) => {
    return (
        <div className='flex direction-column justify-center  my-4'>
             <article className='bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 w-250'>
<h2 className='text-lg font-semibold text-orange-600 mb-2'>{props.title}</h2>
<p className="text-slate-600 text-sm leading-relaxed">{props.info}</p>
    </article>
        </div>
    
    )
  }
  
  export default Information