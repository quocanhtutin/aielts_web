import React, { useState, useContext } from 'react'
import Home from './pages/Home/Home'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import Course from './pages/Course/Course'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AccountManagement from './pages/AccountManagement/AccountManagement'
import CourseManagement from './pages/CourseManagement/CourseManagement'
import LoginPopup from './components/LoginPopup/LoginPopup'
import { StoreContext } from './context/StoreContext'
import CourseDetail from './pages/CourseDetail/CourseDetail'
import CourseDetailManagement from './pages/CourseDetailManagement/CourseDetailManagement'
import OwnedCourses from './pages/OwnedCourses/OwnedCourses'
import OwnedCourse from './pages/OwnedCourse/OwnedCourse'
import ContactInformationManagement from './pages/ContactInformationManagement/ContactInformationManagement'
import Payment from './pages/Payment/Payment'
import UserProfile from './pages/UserProfile/UserProfile'
import MyNewWords from './components/NewWordsPages/MyNewWords'
import FlashCards from './components/NewWordsPages/StudyNewWords/FlashCards'
import PublicNewWordCollections from './components/NewWordsPages/PublicCollections/PublicNewWordCollections'
import CambridgeLibrary from './pages/Testing/CambridgeLibrary'
import ListeningTestPage from './pages/Testing/ListeningTestPage'
import ReadingTestPage from './pages/Testing/ReadingTestPage'
import WritingTestPage from './pages/Testing/WritingTestPage'
import SpeakingTestPage from './pages/Testing/SpeakingTestPage'
import FlashcardManagement from './pages/FlashcardManagement/FlashcardManagement'
import TestManagement from './pages/TestManagement/TestManagement'

const App = () => {

  const { userRole, courses } = useContext(StoreContext)
  const [showLogin, setShowLogin] = useState(false)
  const location = useLocation();

  const hideNavbarFor = ['/listeningtest', '/readingtest', '/writingtest', '/speakingtest'];
  const hideNavbar = hideNavbarFor.some(p => location.pathname.startsWith(p));

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className='app-container'>
        <ToastContainer />
        {!hideNavbar && <Navbar setShowLogin={setShowLogin} />}
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/courses' element={<Course courses={courses} />} />
          <Route path='/course/:id' element={<CourseDetail setShowLogin={setShowLogin} />} />
          <Route path='/publiccollection' element= {<PublicNewWordCollections setShowLogin={setShowLogin} />}/>
          <Route path='/cambridgelibrary' element={<CambridgeLibrary />} />
          
          {userRole === "admin" && (
            <>
              <Route path='/admin/accountmanagement' element={<AccountManagement />} />
              <Route path='/admin/coursemanagement' element={<CourseManagement />} />
              <Route path='/admin/coursedetail/:id' element={<CourseDetailManagement />} />
              <Route path='/admin/contactInformation' element={<ContactInformationManagement />} />
              <Route path='/admin/profile' element={<UserProfile />} />
              <Route path='/admin/flashcardmanagement/:id' element={<FlashcardManagement />} />
              <Route path='/admin/testmanagement/:id' element={<TestManagement />} />
            </>
          )}
          {userRole === "user" && (
            <>
              <Route path='/user/ownedCourses' element={<OwnedCourses />} />
              <Route path='/user/ownedCourse/:id' element={<OwnedCourse />} />
              <Route path='/user/register/:id' element={<Payment />} />
              <Route path='/user/profile' element={<UserProfile />} />
              <Route path='/user/mynewwordsboard' element={<MyNewWords />} />
              <Route path='/user/flashcards/:collectionID' element={<FlashCards />} />
              <Route path='/listeningtest/:id' element={<ListeningTestPage />} />
              <Route path='/readingtest/:id' element={<ReadingTestPage />} />
              <Route path='/writingtest/:id' element={<WritingTestPage />} />
              <Route path='/speakingtest/:id' element={<SpeakingTestPage />} />
            </>
          )}
        </Routes>
      </div>
    </>
  )
}

export default App
