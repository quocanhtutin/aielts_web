import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StoreContext } from '../../context/StoreContext'
import AutoResizeTextarea from '../../components/AutoResizeTextarea/AutoResizeTextarea'
import './SpeakingTestManagement.css'
import { Archive, ArchiveX, AsteriskIcon } from 'lucide-react'

const defaultSpeakingParts = [
  {
    part: 1,
    title: 'Part 1 - Introduction and Interview',
    duration: '4-5 minutes',
    questions: [
      ''
    ]
  },

  {
    part: 2,
    title: 'Part 2 - Long Turn',
    duration: '3-4 minutes',
    cueCard: {
      topic: '',
      points: ['']
    }
  },

  {
    part: 3,
    title: 'Part 3 - Discussion',
    duration: '4-5 minutes',
    questions: [
      ''
    ]
  }
]

const SpeakingTestManagement = ({
  testCollection,
  collectionSkills,
  setCollectionSkills
}) => {

  const { url, token } = useContext(StoreContext)

  const [skillId, setSkillId] = useState(
    testCollection
      ? (
          collectionSkills.find(
            s => s?.type?.toLowerCase().includes('speaking')
          )?._id
        )
      : null
  )

  const [title, setTitle] = useState('')

  const [duration, setDuration] = useState(15)
  const [isAct, setIsAct] = useState(false)
  const [speakingParts, setSpeakingParts] = useState(defaultSpeakingParts)
  const [generatingPart1, setGeneratingPart1] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {

    setSkillId(
      testCollection
        ? (
            collectionSkills.find(
              s => s?.type?.toLowerCase().includes('speaking')
            )?._id
          )
        : null
    )

  }, [collectionSkills, testCollection])

  const fetchSkill = async () => {

    if (!skillId) return

    try {

      const res = await axios.get(
        `${url}/api/test/skills/${skillId}/practice`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data?.success) {

        const skill = res.data.data || {}

        setTitle(skill.title || '')

        setDuration(skill.duration || 15)

        setIsAct(skill.isActive || false)

        if (
          Array.isArray(skill.speakingParts) &&
          skill.speakingParts.length
        ) {

          setSpeakingParts(skill.speakingParts)

        }

      }

    } catch (err) {

      console.error(err)

      toast.error('Không thể tải speaking test')

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

    if (skillId) {
      fetchSkill()
    }

  }, [skillId])

  const handlePartChange = (
    partIndex,
    field,
    value
  ) => {

    setSpeakingParts(prev =>
      prev.map((part, idx) =>
        idx === partIndex
          ? {
              ...part,
              [field]: value
            }
          : part
      )
    )

  }

  const handleQuestionChange = (
    partIndex,
    questionIndex,
    value
  ) => {

    setSpeakingParts(prev =>
      prev.map((part, idx) => {

        if (idx !== partIndex) return part

        const updatedQuestions = [...part.questions]

        updatedQuestions[questionIndex] = value

        return {
          ...part,
          questions: updatedQuestions
        }

      })
    )

  }

  const addQuestion = (partIndex) => {

    setSpeakingParts(prev =>
      prev.map((part, idx) => {

        if (idx !== partIndex) return part

        return {
          ...part,
          questions: [
            ...(part.questions || []),
            ''
          ]
        }

      })
    )

  }

  const removeQuestion = (
    partIndex,
    questionIndex
  ) => {

    setSpeakingParts(prev =>
      prev.map((part, idx) => {

        if (idx !== partIndex) return part

        return {
          ...part,
          questions: part.questions.filter(
            (_, i) => i !== questionIndex
          )
        }

      })
    )

  }

  const handleCueCardChange = (
    field,
    value
  ) => {

    setSpeakingParts(prev =>
      prev.map(part => {

        if (part.part !== 2) return part

        return {
          ...part,
          cueCard: {
            ...part.cueCard,
            [field]: value
          }
        }

      })
    )

  }

  const handleCuePointChange = (
    pointIndex,
    value
  ) => {

    setSpeakingParts(prev =>
      prev.map(part => {

        if (part.part !== 2) return part

        const updatedPoints = [
          ...(part.cueCard?.points || [])
        ]

        updatedPoints[pointIndex] = value

        return {
          ...part,
          cueCard: {
            ...part.cueCard,
            points: updatedPoints
          }
        }

      })
    )

  }

  const addCuePoint = () => {

    setSpeakingParts(prev =>
      prev.map(part => {

        if (part.part !== 2) return part

        return {
          ...part,
          cueCard: {
            ...part.cueCard,
            points: [
              ...(part.cueCard?.points || []),
              ''
            ]
          }
        }

      })
    )

  }

  const removeCuePoint = (index) => {

    setSpeakingParts(prev =>
      prev.map(part => {

        if (part.part !== 2) return part

        return {
          ...part,
          cueCard: {
            ...part.cueCard,
            points: part.cueCard.points.filter(
              (_, i) => i !== index
            )
          }
        }

      })
    )

  }

  const createTest = async () => {

    if (!title.trim()) {
      toast.error('Tiêu đề không được để trống')
      return
    }

    try {

      setSaving(true)

      const payload = {
        testCollectionId: testCollection._id,
        type: 'speaking',
        title,
        duration,

        speakingParts
      }

      const res = await axios.post(
        `${url}/api/test/skills`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data?.success) {

        toast.success(
          'Tạo speaking test thành công'
        )

        setCollectionSkills(prev =>
          Array.isArray(prev)
            ? [...prev, res.data.data]
            : [res.data.data]
        )

        setSkillId(
          res.data.data?._id || null
        )

      }

    } catch (err) {

      console.error(err)

      toast.error('Tạo speaking test thất bại')

    } finally {

      setSaving(false)

    }

  }

  const updateTest = async () => {

    try {

      setSaving(true)

      const payload = {
        testCollectionId: testCollection._id,
        type: 'speaking',
        title,
        duration,

        speakingParts
      }

      const res = await axios.put(
        `${url}/api/test/skills/${skillId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data?.success) {

        toast.success(
          'Cập nhật speaking test thành công'
        )

        setCollectionSkills(prev =>
          prev.map(skill =>
            skill._id === skillId
              ? res.data.data
              : skill
          )
        )

      }

    } catch (err) {

      console.error(err)

      toast.error('Cập nhật thất bại')

    } finally {

      setSaving(false)

    }

  }

  const handleSave = () => {

    if (skillId) {
      updateTest()
    } else {
      createTest()
    }

  }

  const handleGeneratePart1 = async () => {
    try {
        setGeneratingPart1(true);

        const res = await axios.post(
        `${url}/api/test/speaking/generate-part1`,
        {
            testSkillId: skillId
        },
        {
            headers: {
            Authorization: `Bearer ${token}`
            }
        }
        );

        if (!res.data.success) return;

        const questions =
        res.data.data.questions;

        setSpeakingParts(prev =>
        prev.map(part =>
            part.part === 1
            ? {
                ...part,
                questions
                }
            : part
        )
        );

    } catch (err) {
        console.error(err);
        toast.error(
        "Generate Part 1 failed"
        );
    } finally {
        setGeneratingPart1(false);
    }
    };


  return (
    <div className="ltm_listening_manage">

      <div className="ltm_listening_header">

        <div className="ltm_header_field ltm_add_title">
          <label>Title</label>

          <input
            className="ltm_input ltm_title_input"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Test title" 
          />
        </div>

        <div className="ltm_header_field ltm_add_duration">
          <label>Duration</label>

          <input
            className="ltm_input ltm_duration_input"
            type="number"
            value={duration}
            onChange={(e) =>
              setDuration(
                Number(e.target.value || 0)
              )
            }
          />
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

        <button
          className="ltm_btn ltm_primary"
          onClick={handleSave}
          disabled={saving}
        >
          {
            skillId
              ? 'Save Speaking Test'
              : 'Create Speaking Test'
          }
        </button>

      </div>

        {skillId&&(<div className="ltm_listening_container">
			<div className="ltm_part_builder">
                <div className="ltm_parts_list">

                    {speakingParts.map((part, partIndex) => (

                    <div
                        key={partIndex}
                        className="ltm_part_card"
                        style={{position:'relative'}}
                    >
                        {part.part === 1 && (
                            <button
                            className={`fab ${generatingPart1 ? 'loading' : ''}`}
                            style={{ position:'absolute', top:8, right:8, backgroundColor: generatingPart1 ? undefined : 'transparent' }}
                            title="AI hỗ trợ tạo part 1"
                            onClick={() => handleGeneratePart1()}
                            disabled={generatingPart1}
                            aria-busy={generatingPart1}
                            >
                            <AsteriskIcon size={20} />
                            </button>)}

                        <div className="ltm_part_header">

                        <div className="ltm_part_header_left">
                            <strong>{part.title}</strong>
                        </div>

                        </div>

                        <div className="ltm_part_body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        <div className="ltm_header_field">
                            <label style={{minWidth: '30%'}}>Title</label>

                            <input
                            style={{flex: 1}}
                            className="ltm_input"
                            value={part.title}
                            onChange={(e) =>
                                handlePartChange(
                                partIndex,
                                'title',
                                e.target.value
                                )
                            }
                            />
                        </div>

                        <div className="ltm_header_field">
                            <label style={{minWidth: '30%'}}>Duration</label>

                            <input
                            style={{flex: 1}}
                            className="ltm_input"
                            value={part.duration}
                            onChange={(e) =>
                                handlePartChange(
                                partIndex,
                                'duration',
                                e.target.value
                                )
                            }
                            />
                        </div>

                        {part.part !== 2 ? (

                            <div className="stm_question_group">

                            <label style={{minWidth: '30%'}}>Questions</label>

                            {part.questions?.map(
                                (question, qIndex) => (

                                <div
                                    key={qIndex}
                                    className="stm_question_item"
                                >

                                    <input
                                    style={{flex: 1}}
                                    className="ltm_input"
                                    value={question}
                                    onChange={(e) =>
                                        handleQuestionChange(
                                        partIndex,
                                        qIndex,
                                        e.target.value
                                        )
                                    }
                                    />

                                    <button
                                    className="ltm_btn"
                                    onClick={() =>
                                        removeQuestion(
                                        partIndex,
                                        qIndex
                                        )
                                    }
                                    >
                                    Delete
                                    </button>

                                </div>

                                )
                            )}

                            <button
                                className="ltm_btn"
                                onClick={() =>
                                addQuestion(partIndex)
                                }
                            >
                                + Add Question
                            </button>

                            </div>

                        ) : (

                            <div className="stm_cue_card">

                            <div className="ltm_header_field">
                                <label style={{minWidth: '30%'}}>Topic</label>

                                <input
                                style={{flex: 1}}
                                className="ltm_input"
                                value={
                                    part.cueCard?.topic || ''
                                }
                                onChange={(e) =>
                                    handleCueCardChange(
                                    'topic',
                                    e.target.value
                                    )
                                }
                                />
                            </div>

                            <div className="stm_question_group">

                                <label style={{minWidth: '30%'}}>Points</label>

                                {part.cueCard?.points?.map(
                                (point, pointIndex) => (

                                    <div
                                    key={pointIndex}
                                    className="stm_question_item"
                                    >

                                    <input
                                        style={{flex: 1}}
                                        className="ltm_input"
                                        value={point}
                                        onChange={(e) =>
                                        handleCuePointChange(
                                            pointIndex,
                                            e.target.value
                                        )
                                        }
                                    />

                                    <button
                                        className="ltm_btn"
                                        onClick={() =>
                                        removeCuePoint(
                                            pointIndex
                                        )
                                        }
                                    >
                                        Delete
                                    </button>

                                    </div>

                                )
                                )}

                                <button
                                className="ltm_btn"
                                onClick={addCuePoint}
                                >
                                + Add Point
                                </button>

                            </div>

                            </div>

                        )}

                        </div>

                    </div>

                    ))}

                </div>
            </div>
        </div>)}
    </div>
  )

}

export default SpeakingTestManagement

