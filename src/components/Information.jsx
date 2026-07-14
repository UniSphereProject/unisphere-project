

const Information = (props) => {
  return (
    <div className='flex flex-col items-center justify-center my-4'>
      <article className='w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200'>
        <h2 className='text-base sm:text-lg font-semibold text-orange-600 mb-2'>{props.title}</h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{props.info}</p>
      </article>
    </div>
  )
}

export default Information