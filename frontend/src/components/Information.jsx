import React from 'react';
import { Clock, User } from 'lucide-react';

const Information = ({ title, info, date, author }) => {
  return (
    <div className='flex justify-center my-4'>
      <article className='bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 w-full max-w-2xl'>
        <h2 className='text-lg font-semibold text-orange-600 mb-2'>{title}</h2>
        {info && (
          <p className="text-slate-600 text-sm leading-relaxed mb-3">{info}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {author && (
            <span className="flex items-center gap-1">
              <User size={11} /> {author}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {date}
            </span>
          )}
        </div>
      </article>
    </div>
  );
};

export default Information;
