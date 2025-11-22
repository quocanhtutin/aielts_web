import React, { useState, useContext } from 'react'
import Home from './pages/Home/Home'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
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

const App = () => {

  const { userRole, courses } = useContext(StoreContext)
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div>
        <ToastContainer />
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/courses' element={<Course courses={courses} />} />
          <Route path='/course/:id' element={<CourseDetail setShowLogin={setShowLogin} />} />
          {userRole === "admin" && (
            <>
              <Route path='/admin/accountmanagement' element={<AccountManagement />} />
              <Route path='/admin/coursemanagement' element={<CourseManagement />} />
              <Route path='/admin/coursedetail/:id' element={<CourseDetailManagement />} />
              <Route path='/admin/contactInformation' element={<ContactInformationManagement />} />
            </>
          )}
          {userRole === "user" && (
            <>
              <Route path='/user/ownedCourses' element={<OwnedCourses />} />
              <Route path='/user/ownedCourse/:id' element={<OwnedCourse />} />
              <Route path='/user/register/:id' element={<Payment />} />
            </>
          )}
        </Routes>
      </div>
    </>
  )
}

export default App
