import React, { useEffect, useState, useRef, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import AutoResizeTextarea from '../../components/AutoResizeTextarea/AutoResizeTextarea'
import './ListeningTestManagement.css'
import { Pen, PenOff, FilePlusCorner, FileHeadphone, Trash2, ScrollText, ChevronDown,ChevronUp, ALargeSmall, PlusCircle, Archive, ArchiveX } from 'lucide-react'

const defaultTask1 = {
	task: 1,
	title: 'Task 1',
	instruction: '',
	question: '',
	image: {},
	imageAlt: '',
	minWords: 150,
	recommendedTime: 20
}

const defaultTask2 = {
	task: 2,
	title: 'Task 2',
	instruction: '',
	question: '',
	image: {},
	imageAlt: '',
	minWords: 250,
	recommendedTime: 40
}

const WritingTestManagement = ({ testCollection, setSidebarData, collectionSkills, setCollectionSkills }) => {
	const { url, token } = useContext(StoreContext)
	const navigate = useNavigate()
	const location = useLocation()
	const [isAct, setIsAct] = useState(false)
	const [skillId, setSkillId] = useState(testCollection ? (collectionSkills.find(s => s?.type?.toLowerCase().includes('writing'))?._id) : null)
	const [title, setTitle] = useState('')
	const [duration, setDuration] = useState(60)
	const [writingTasks, setWritingTasks] = useState([ { ...defaultTask1 } ])
	const [loadedSkill, setLoadedSkill] = useState(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		setSkillId(testCollection ? (collectionSkills.find(s => s?.type?.toLowerCase().includes('writing'))?._id) : null)
	}, [collectionSkills, testCollection])

	const fetchSkill = async () => {
		if (!skillId) return
		try {
			const res = await axios.get(`${url}/api/test/skills/${skillId}/practice`, { headers: { Authorization: `Bearer ${token}` } })
			if (res.data?.success) {
				const skill = res.data.data || {}
				setLoadedSkill(skill)
				setTitle(skill.title || '')
				setDuration(skill.duration || 60)
				setIsAct(skill.isActive || false)
				if (Array.isArray(skill.writingTasks) && skill.writingTasks.length) {
					setWritingTasks(skill.writingTasks.map((t, i) => ({
						task: Number(t.task || (i + 1)),
						title: t.title || `Task ${i + 1}`,
						instruction: t.instruction || '',
						question: t.question || '',
						image: t.image || {},
						imageAlt: t.imageAlt || '',
						minWords: Number(t.minWords || (i === 0 ? 150 : 250)),
						recommendedTime: Number(t.recommendedTime || (i === 0 ? 20 : 40))
					})))
				}
			}
		} catch (err) {
			console.error(err)
			toast.error('Không thể tải dữ liệu writing test')
		}
	}

	const toggleActive = async (isActive) => {
    try{
      const res = await axios.put(`${url}/api/test/skills/${skillId}/active`, { isActive: isActive }, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data?.success) {
        setIsAct(isActive)
      }
    } catch (e) {
      console.error(e)
      toast.error('Lỗi cập nhật trạng thái test')
    }
  }

	useEffect(() => {
		if (skillId) fetchSkill()
		else {
			setLoadedSkill(null)
			setTitle('')
			setDuration(60)
			setWritingTasks([{ ...defaultTask1 }])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [skillId, url, token])

	const uploadToServer = async (file) => {
		const form = new FormData()
		form.append('file', file)
		const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
		const res = await axios.post(`${url}/api/upload`, form, headers)
		return res.data
	}

	const handleUploadImage = async (index, file) => {
		if (!file) return
		try {
			toast.info('Uploading image...')
			const data = await uploadToServer(file)
			const imgUrl = data?.url || data?.data || data
			setWritingTasks(prev => prev.map((t, i) => i === index ? ({ ...t, image: imgUrl }) : t))
			toast.success('Image uploaded')
		} catch (err) {
			console.error(err)
			toast.error('Image upload failed')
		}
	}

	const handleAddTask = () => {
		if (writingTasks.length >= 2) {
			toast.error('Chỉ có thể thêm tối đa 2 task')
			return
		}
		setWritingTasks(prev => [...prev, { ...defaultTask2 }])
	}

	const handleRemoveTask = (index) => {
		setWritingTasks(prev => prev.filter((_, i) => i !== index))
	}

	const handleTaskChange = (index, field, value) => {
		setWritingTasks(prev => prev.map((t, i) => i === index ? ({ ...t, [field]: value }) : t))
	}

	const createTest = async () => {
		if (!title.trim()) { toast.error('Tiêu đề test không được để trống'); return }
		if (!testCollection || !testCollection._id) { toast.error('Chưa chọn collection'); return }
		const payload = {
			testCollectionId: testCollection._id,
			type: 'writing',
			title: title.trim(),
			duration: Number(duration) || 60,
			writingTasks: writingTasks.map(t => ({
				task: Number(t.task || 0),
				title: t.title || '',
				instruction: t.instruction || '',
				question: t.question || '',
				image: t.image || {},
				imageAlt: t.imageAlt || '',
				minWords: Number(t.minWords || 0),
				recommendedTime: Number(t.recommendedTime || 0)
			}))
		}

		try {
			setSaving(true)
			const res = await axios.post(`${url}/api/test/skills`, payload, { headers: { Authorization: `Bearer ${token}` } })
			if (res.data?.success) {
				toast.success('Tạo writing test thành công')
				setCollectionSkills && setCollectionSkills(prev => Array.isArray(prev) ? [...prev, res.data.data] : [res.data.data])
				setSkillId(res.data.data?._id || null)
			} else {
				toast.error(res.data?.message || 'Lỗi khi tạo test')
			}
		} catch (err) {
			console.error(err)
			toast.error('Lỗi khi tạo test')
		} finally {
			setSaving(false)
		}
	}

	const updateTest = async () => {
		if (!title.trim()) { toast.error('Tiêu đề test không được để trống'); return }
		if (!skillId) { toast.error('Skill ID không tồn tại'); return }
		const payload = {
			testCollectionId: testCollection._id,
			type: 'writing',
			title: title.trim(),
			duration: Number(duration) || 60,
			writingTasks: writingTasks.map(t => ({
				task: Number(t.task || 0),
				title: t.title || '',
				instruction: t.instruction || '',
				question: t.question || '',
				image: t.image || {},
				imageAlt: t.imageAlt || '',
				minWords: Number(t.minWords || 0),
				recommendedTime: Number(t.recommendedTime || 0)
			}))
		}

		try {
			setSaving(true)
			const res = await axios.put(`${url}/api/test/skills/${skillId}`, payload, { headers: { Authorization: `Bearer ${token}` } })
			if (res.data?.success) {
				toast.success('Cập nhật writing test thành công')
				// update collectionSkills in parent
				if (setCollectionSkills) {
					setCollectionSkills(prev => (Array.isArray(prev) ? prev.map(s => s._id === skillId ? res.data.data : s) : [res.data.data]))
				}
			} else {
				toast.error(res.data?.message || 'Lỗi khi cập nhật test')
			}
		} catch (err) {
			console.error(err)
			toast.error('Lỗi khi cập nhật test')
		} finally {
			setSaving(false)
		}
	}

	const handleSaveOrCreate = () => {
		if (skillId) updateTest()
		else createTest()
	}

	return (
		<div className="ltm_listening_manage">
			<div className="ltm_listening_header">
				<div className="ltm_header_field ltm_add_title">
					<label>Title</label>
					<input className="ltm_input ltm_title_input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test title" />
				</div>
				<div className="ltm_header_field ltm_add_duration">
					<label>Duration</label>
					<input className="ltm_input ltm_duration_input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value || 0))} placeholder='(minutes)' />
				</div>

				{skillId&&(isAct?
						<div className="toggle_archieve" style={{ cursor: 'pointer' }} onClick={()=>toggleActive(false)}>
						  <Archive size={22} className="" title="Archive" />
						  Lưu trữ
						</div>
						:
						<div className="toggle_archieve" style={{ cursor: 'pointer' }} onClick={()=>toggleActive(true)}>
						  <ArchiveX size={22} className="" title="Unarchive" />
						  Bỏ lưu trữ
						</div>
						)}

				<button className="ltm_btn ltm_primary" onClick={handleSaveOrCreate}>{skillId ? 'Save Writing Test' : 'Create Writing Test'}</button>
			</div>

			{skillId&&(<div className="ltm_listening_container">
				<div className="ltm_part_builder">
					<div className="ltm_parts_list">
						{writingTasks.map((task, idx) => (
							<div key={idx} className="ltm_part_card">
								<div className="ltm_part_header">
									<div className="ltm_part_header_left">
										<strong>{task.title || `Task ${task.task}`}</strong>
										<div>Task {task.task}</div>
									</div>
									<div className="ltm_part_header_right">
										{writingTasks.length > 1 && <button className="ltm_btn" onClick={() => handleRemoveTask(idx)}>Delete</button>}
									</div>
								</div>

								<div className="ltm_part_body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
									<div className="ltm_header_field">
										<label style={{minWidth: '30%'}}>Title</label>
										<input style={{flex: 1}} className="ltm_input" value={task.title} onChange={(e) => handleTaskChange(idx, 'title', e.target.value)} />
									</div>

									<div className="ltm_header_field">
										<label style={{minWidth: '30%'}}>Instruction</label>
										<input style={{flex: 1}} className="ltm_input" value={task.instruction} onChange={(e) => handleTaskChange(idx, 'instruction', e.target.value)} />
									</div>

									<div className="ltm_header_field">
										<label style={{minWidth: '30%'}}>Question</label>
										<AutoResizeTextarea className="ltm_textarea" value={task.question} onChange={(e) => handleTaskChange(idx, 'question', e.target.value)} />
									</div>

										<div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <label style={{minWidth: '30%'}}>Image</label>
											{task.image.url ? (
												<>
													<img src={task.image.url} alt={task.imageAlt || ''} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
													<button className="ltm_btn" onClick={() => document.getElementById(`writing_task_img_${idx}`)?.click()}>Update</button>
													<button className="ltm_btn" onClick={() => { handleTaskChange(idx, 'image', ''); handleTaskChange(idx, 'imageAlt', '') }}>Remove</button>
												</>
											) : (
												<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; await handleUploadImage(idx, f) }} />
											)}
											<input className="ltm_input" placeholder="Alt text" value={task.imageAlt || ''} onChange={(e) => handleTaskChange(idx, 'imageAlt', e.target.value)} />
											<input id={`writing_task_img_${idx}`} type="file" style={{ display: 'none' }} accept="image/*" onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; await handleUploadImage(idx, f) }} />
										</div>
									<div className="ltm_header_field">
										<label style={{minWidth: '30%'}}>Min words</label>
										<input className="ltm_small_input" type="number" value={task.minWords} onChange={(e) => handleTaskChange(idx, 'minWords', Number(e.target.value || 0))} />
									</div>
									<div className="ltm_header_field">
										<label style={{minWidth: '30%'}}>Recommended time (min)</label>
										<input className="ltm_small_input" type="number" value={task.recommendedTime} onChange={(e) => handleTaskChange(idx, 'recommendedTime', Number(e.target.value || 0))} />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="ltm_part_controls">
					{writingTasks.length < 2 && <button className="ltm_btn ltm_add_part_btn" onClick={handleAddTask}>+ Add Task</button>}
				</div>
			</div>)}
		</div>
	)
}

export default WritingTestManagement