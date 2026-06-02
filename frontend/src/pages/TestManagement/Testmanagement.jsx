import React, { useState, useEffect, useRef, useContext } from 'react'
import './TestManagement.css'
import ManagementSidebar from '../../components/ManagementSidebar/ManagementSidebar'
import ListeningTestManagement from './ListeningTestManagement'
import ReadingTestManagement from './ReadingTestManagement'
import WritingTestManagement from './WritingTestManagement'
import SpeakingTestManagement from './SpeakingTestManagement'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Pen, PenOff } from 'lucide-react'
import { useParams } from 'react-router-dom'

const TestManagement = () => {
  const { url, token } = useContext(StoreContext)
  const { id } = useParams() // collection id from url

  const [sidebarData, setSidebarData] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionSkills, setCollectionSkills] = useState([])

  const [editingTitle, setEditingTitle] = useState(false)
  const [collectionTitleInput, setCollectionTitleInput] = useState("")
  const [titleError, setTitleError] = useState("")

  const [descriptionInput, setDescriptionInput] = useState("")
  const [editingDescription, setEditingDescription] = useState(false)

  const [activeSkill, setActiveSkill] = useState('listening')

  const titleInputRef = useRef(null)

  const fetchCollectionById = async (collectionId) => {
    try{
      const res = await axios.get(`${url}/api/test/collections/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if(res.data.success){
        return res.data.data
      }
    }
    catch (error){
      console.error(error)
      toast.error("Lỗi tải dữ liệu bộ sưu tập!")
    }
  }

  useEffect(() => {
    if (editingTitle) {
      setTimeout(() => {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      }, 0)
    }
  }, [editingTitle])



  useEffect(() => {
    if (id && sidebarData> 0) {

    }
  }, [id, sidebarData]) 

    useEffect(() => {
    const fetchSidebar = async () => {
          try {
              const res = await axios.get(`${url}/api/test/collections`, {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              })

              if(!res.data.success){
                  toast.error("Lỗi tải dữ liệu!")
                  return;
              }

              setSidebarData(res.data.data)
          } catch (error) {
            console.log(error);
            
              toast.error("Lỗi tải dữ liệu!")
          }
      }

      if(token){
          fetchSidebar()
      }

  }, [url, token])

  const handleSelectItem = async (id) => {
    // find collection
    const found = sidebarData.flatMap(s => s.collection).find(c => c._id === id)
    if (found) {
      setSelectedCollection(found)
      setCollectionTitleInput(found.name || '')
      setDescriptionInput(found.description || '')
      setActiveSkill('listening')
      setEditingTitle(false)
      setEditingDescription(false)
      // fetch collection details including skills
      const collectionData = await fetchCollectionById(id)
      if (collectionData) {
        setCollectionSkills(collectionData.skills || [])
      }
    }
  }

  const handleSaveTitle = async () => {
    const newTitle = collectionTitleInput.trim()
    if (!newTitle) {
      setTitleError('Tên không được để trống')
      return
    }

    // attempt update to backend if url/token available
    if (url && token && selectedCollection && selectedCollection._id && !String(selectedCollection._id).startsWith('user_')) {
      try {
        const res = await axios.put(`${url}/api/test/collections/${selectedCollection._id}`, { title: newTitle }, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.data?.success) {
          toast.error('Lỗi cập nhật tiêu đề')
          return
        }
      } catch (e) {
        console.error(e)
        toast.error('Lỗi cập nhật tiêu đề')
        return
      }
    }

    // update local sidebar and selected
    setSidebarData(prev => prev.map(cat => ({
      ...cat,
      collection: cat.collection.map(col => col._id === selectedCollection._id ? { ...col, name: newTitle } : col)
    })))

    setSelectedCollection(prev => prev ? ({ ...prev, name: newTitle }) : prev)
    setEditingTitle(false)
    setTitleError('')
  }

  const handleSaveDescription = async () => {
    const newDesc = descriptionInput
    if (url && token && selectedCollection && selectedCollection._id && !String(selectedCollection._id).startsWith('user_')) {
      try {
        const res = await axios.put(`${url}/api/test/collections/${selectedCollection._id}`, { description: newDesc }, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.data?.success) {
          toast.error('Lỗi cập nhật mô tả')
          return
        }
      } catch (e) {
        console.error(e)
        toast.error('Lỗi cập nhật mô tả')
        return
      }
    }

    setSidebarData(prev => prev.map(cat => ({
      ...cat,
      collection: cat.collection.map(col => col._id === selectedCollection._id ? { ...col, description: newDesc } : col)
    })))
    setSelectedCollection(prev => prev ? ({ ...prev, description: newDesc }) : prev)
    setEditingDescription(false)
  }

  const skills = [
    { key: 'listening', label: 'Listening' },
    { key: 'reading', label: 'Reading' },
    { key: 'writing', label: 'Writing' },
    { key: 'speaking', label: 'Speaking' }
  ]

  const handleAddCategory = async (listTitle, addingIndex) => {
      if (!listTitle.trim()) return;
      try {
          const response = await axios.post(`${url}/api/test/collections`,{
              title: listTitle,
              type: sidebarData[addingIndex].category
          },{
              headers: { Authorization: `Bearer ${token}` },
          })
          if(response.data.success){
              const newTopic = response.data.data
              const newSidebarData = [...sidebarData]
              newSidebarData[addingIndex].collection.unshift({_id: newTopic._id, name: newTopic.title})
              setSidebarData(newSidebarData)
          }
      } catch (error) { 
          console.error(error); 
          toast.error("Lỗi tạo bộ sưu tập!")
      }
  }

  return (
    <div className='tm_test_management_container'>
      <ManagementSidebar
        title="Test Management"
        sidebarData={sidebarData}
        onSelectItem={handleSelectItem}
        handleAddCategory={handleAddCategory}
        linkSelectItem="admin/testmanagement"
      />

      <div className="tm_test_content">
        <div className="tm_test_header">
          {selectedCollection ? (
            editingTitle ? (
              <div className='tm_edit_title_row'>
                <input
                  ref={titleInputRef}
                  className='tm_edit_title_input'
                  value={collectionTitleInput}
                  onChange={(e) => { setCollectionTitleInput(e.target.value); if (e.target.value.trim()) setTitleError('') }}
                  onKeyDown={async (e) => { if (e.key === 'Enter') await handleSaveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setCollectionTitleInput(selectedCollection.name || '') } }}
                />
                <PenOff size={18} onClick={handleSaveTitle} style={{ cursor: 'pointer', marginLeft: 8 }} />
                {titleError && <div className='tm_error_text'>{titleError}</div>}
              </div>
            ) : (
              <div className='tm_title_row'>
                <h2 className='tm_title_text'>{selectedCollection.name}</h2>
                <Pen size={18} onClick={() => { setCollectionTitleInput(selectedCollection.name || ''); setEditingTitle(true); setTitleError('') }} style={{ cursor: 'pointer', marginLeft: 12 }} />
              </div>
            )
          ) : (
            <div className='tm_title_row'>
                <h2 className='tm_title_text'>Select a test collection to manage</h2>
            </div>
          )}

          {/* {selectedCollection && (
            <div className='tm_description_row'>
              {editingDescription ? (
                <div>
                  <textarea className='tm_description_textarea' value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} />
                  <div className='tm_description_actions'>
                    <button className='tm_btn tm_primary' onClick={handleSaveDescription}>Save</button>
                    <button className='tm_btn' onClick={() => { setEditingDescription(false); setDescriptionInput(selectedCollection.description || '') }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className='tm_desc_text'>{selectedCollection.description || <em>No description</em>}</div>
                  <button className='tm_btn' onClick={() => setEditingDescription(true)}>Edit description</button>
                </div>
              )}
            </div>
          )} */}

        </div>

        <div className='tm_skill'>
          <div className='tm_skill_navbar'>
            {skills.map(s => (
              <button key={s.key} className={`tm_skill_btn ${s.key === activeSkill ? 'tm_skill_active' : ''}`} onClick={() => setActiveSkill(s.key)}>{s.label}</button>
            ))}
          </div>

          <div className='tm_skill_content'>
            {selectedCollection ? (
              <>
              {activeSkill === 'listening' && (
                <ListeningTestManagement 
                  testCollection={selectedCollection} 
                  setSidebarData={setSidebarData} 
                  collectionSkills={collectionSkills}
                  setCollectionSkills={setCollectionSkills}
                />)}
              {activeSkill === 'reading' && (
                <ReadingTestManagement 
                  testCollection={selectedCollection}
                  setSidebarData={setSidebarData} 
                  collectionSkills={collectionSkills}
                  setCollectionSkills={setCollectionSkills}
                />)}
              {activeSkill === 'writing' && (
                <WritingTestManagement 
                  testCollection={selectedCollection}
                  setSidebarData={setSidebarData} 
                  collectionSkills={collectionSkills}
                  setCollectionSkills={setCollectionSkills}
                />
              )}
              {activeSkill === 'speaking' && (
                <SpeakingTestManagement 
                  testCollection={selectedCollection}
                  setSidebarData={setSidebarData} 
                  collectionSkills={collectionSkills}
                  setCollectionSkills={setCollectionSkills}
                />
              )}
              {activeSkill !== 'listening' && activeSkill !== 'reading' && activeSkill !== 'writing' && activeSkill !== 'speaking' && (
                <div style={{ padding: 20 }}><em>{activeSkill} management not implemented yet.</em></div>
              )}
              </>
            ) : (
              <div style={{ padding: 20 }}><em>Please select a collection from the left.</em></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestManagement
