
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Information from '../components/Information'
import noticeData from '../noticeData'

const Notice = () => {
  const navigate = useNavigate();
  const notices = noticeData.map((notice) => (
    <Information
      key={notice.id}
      title={notice.title}
      info={notice.info}
    />
  ))

  return (
    <>
      <div className="bg-slate-100 min-h-screen m-0 py-2">
        <Navbar />
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar
            onCommunitySelect={(slug) => navigate(`/home?community=${slug}`)}
            onCreatePost={() => navigate('/home?create=1')}
          />

          {/* Main Content */}
          <div className="mt-16 flex-1 px-3 sm:px-6 py-4 ml-0 md:ml-64">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">📢 Notices</h1>
              {notices}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notice
