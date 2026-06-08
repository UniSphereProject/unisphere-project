import React from 'react'
import Navbar from '../components/Navbar'
import Notescard from '../components/Notescard'
import notesData from '../notesData'

const Notes = () => {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-20 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {notesData.map((note) => (
            <Notescard
              key={note.id}
              title={note.title}
              poster={note.poster}
              batch={note.batch}
              date={note.date}
              thumbnail={note.thumbnail}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default Notes