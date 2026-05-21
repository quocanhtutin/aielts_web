import React, { useState, useContext, useEffect, useRef, use } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import './ListeningTestManagement.css'
import { Pen, PenOff, FilePlusCorner, FileHeadphone, ScrollText, ChevronDown,ChevronUp, ALargeSmall, PlusCircle, Trash2 } from 'lucide-react'
import ListeningRenderer from '../Testing/ListeningRenderer'
import { NoteExercise, TableExercise, MCQExercise, MatchingExercise } from './ListenngAndReadingTypeManagement'
import { col } from 'framer-motion/client'

const defaultBlockTypes = ["instruction", "note", "mcq", "table", "matching", "image"]

const parseLineToContent = (line) => {
  const parts = []
  const regex = /\[q:(\d+)\]/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(line)) !== null) {
    const idx = match.index
    if (idx > lastIndex) parts.push(line.substring(lastIndex, idx))
    parts.push({ q: Number(match[1]) })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < line.length) parts.push(line.substring(lastIndex))
  return parts
}

  // parse placeholders like (question_33) or question_33 into mixed-content arrays
  const parseQuestionPlaceholdersToArray = (text) => {
    const parts = []
    const regex = /\(question_(\d+)\)|question_(\d+)/ig
    let lastIndex = 0
    let m
    while ((m = regex.exec(text)) !== null) {
      const idx = m.index
      if (idx > lastIndex) parts.push(text.substring(lastIndex, idx))
      const num = m[1] || m[2]
      parts.push({ q: Number(num) })
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex))
    // trim string parts
    const clean = parts.map(p => typeof p === 'string' ? p.trim() : p)
    if (clean.length === 0) return ['']
    return clean
  }

  const defaultExerciseTitles = {
    note: [
      'Complete the notes below.',
      'Complete the summary below.',
      'Complete the sentences below.'
    ],
    table: [
      'Complete the table below.',
      'Fill in the table.'
    ],
    mcq:[
    'Choose the correct letter, A, B or C.',
    'Choose the correct letter, A, B, C or D.',
    'True False or Not Given',
    'Yes No or Not Given'
    ],
    matching: [
      'Label the diagram below.',
      'Match the following.',
      'Select items which are mentioned in the audio.'
    ]
  }



const ListeningTestManagement = ({ testCollection, setSidebarData, collectionSkills, setCollectionSkills }) => {
  const { url, token } = useContext(StoreContext)

  const [skillId, setSkillId] = useState(testCollection ? (collectionSkills.find(s => s?.type?.toLowerCase().includes('listening'))?._id) : null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [duration, setDuration] = useState(30)

  const [parts, setParts] = useState([])

  const [partNumber, setPartNumber] = useState(1)
  const [startQuestion, setStartQuestion] = useState(1)
  const [endQuestion, setEndQuestion] = useState(4)

  const [selectedPartIndex, setSelectedPartIndex] = useState(null)
  const [blockType, setBlockType] = useState('instruction')

  const [instrQuestionRange, setInstrQuestionRange] = useState('')
  const [instrTitle, setInstrTitle] = useState('')
  const [instrNote, setInstrNote] = useState('')

  const [noteHeading, setNoteHeading] = useState('')
  const [noteLinesText, setNoteLinesText] = useState([""])

  const [mcqQuestions, setMcqQuestions] = useState([])

  const [tableHeadersText, setTableHeadersText] = useState('')
  const [tableRowsText, setTableRowsText] = useState([''])

  const [matchingOptions, setMatchingOptions] = useState([{ key: 'A', text: '' }])
  const [matchingQuestions, setMatchingQuestions] = useState([{ q: null, label: '' }])

  const [imageSrc, setImageSrc] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  // Exercise creator states
  const [exerciseType, setExerciseType] = useState('note')
  const [exerciseTitle, setExerciseTitle] = useState(defaultExerciseTitles.note[0])
  const [exerciseNote, setExerciseNote] = useState('')
  const [exerciseStart, setExerciseStart] = useState(Number(startQuestion || 1))
  const [exerciseEnd, setExerciseEnd] = useState(Number(endQuestion || (Number(startQuestion || 1) + 3)))

  const [showExercisePreview, setShowExercisePreview] = useState({})
  const [editingExercise, setEditingExercise] = useState(null) // { partIndex, exerciseIndex }
  const creatorGetPayloadRef = useRef(null)
  const registerCreatorGetPayload = (fn) => { creatorGetPayloadRef.current = fn }
  const [creatorDirty, setCreatorDirty] = useState(false)
  const [dirtyParts, setDirtyParts] = useState({})
  const markPartDirty = (idx) => setDirtyParts(prev => ({ ...prev, [idx]: true }))
  const clearPartDirty = (idx) => setDirtyParts(prev => { const copy = { ...prev }; delete copy[idx]; return copy })
  const navigate = useNavigate()
  const location = useLocation()
  const prevLocationRef = useRef(location.pathname)
  const prevTestCollectionRef = useRef(testCollection?._id)
  const answerPopupRef = useRef(null)

  useEffect(() => {
    setSkillId(testCollection ? (collectionSkills.find(s => s?.type?.toLowerCase().includes('listening'))?._id) : null)
  }, [collectionSkills])

  useEffect(() => {
    // only set a default title for the exercise type when there is no title already
    setExerciseTitle(prev => {
      if (prev && String(prev).trim()) return prev
      return defaultExerciseTitles[exerciseType]?.[0] || ''
    })
  }, [exerciseType])

  // derive exercises array from blocks when backend only stores blocks
  const deriveExercisesFromBlocks = (part) => {
    const blocks = Array.isArray(part?.blocks) ? part.blocks : []
    const exercises = []

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]

      if (!b || b.type !== 'instruction') continue

      let start = null
      let end = null

      if (typeof b.questionRange === 'string') {
        // support:
        // "Questions 1-5"
        // "Question 1-5"
        // "Questions 1–5"
        // "Question 16-22"

        const m = b.questionRange.match(
          /question(?:s)?\s+(\d+)\D+(\d+)/i
        )

        if (m) {
          start = Number(m[1])
          end = Number(m[2])
        }
      }

      // next block may be image then exercise block
      let exerciseBlockIndex = i + 1

      if (
        blocks[exerciseBlockIndex] &&
        blocks[exerciseBlockIndex].type === 'image'
      ) {
        exerciseBlockIndex++
      }

      const exerciseBlock = blocks[exerciseBlockIndex]
      const type = exerciseBlock?.type || 'note'

      exercises.push({
        startQuestion: start || null,
        endQuestion: end || null,
        type,
        title: b.title || '',
        note: b.note || ''
      })

      console.log(exercises)
    }

    return exercises
  }

  const derivePartsWithExercises = (partsArr) => {
    if (!Array.isArray(partsArr)) return []
    return partsArr.map(p => ({ ...(p || {}), exercises: (Array.isArray(p?.exercises) && p.exercises.length) ? p.exercises : deriveExercisesFromBlocks(p) }))
  }

  // fetch existing skill data
  const fetchSkill = async () => {
        try {
          const res = await axios.get(`${url}/api/test/skills/${skillId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.success) {
            const skill = res.data.data
            setLoadedSkill(skill)
            // populate form with skill data
            setTitle(skill.title || '')
            setDescription(skill.description || '')
            setDuration(skill.duration || 30)

            const loadedParts = derivePartsWithExercises(skill.parts || [])
            setParts(loadedParts)
            console.log('Loaded skill parts with exercises:', loadedParts)
            // compute sensible defaults for adding the next part based on loaded parts
            const lastPart = (Array.isArray(loadedParts) && loadedParts.length) ? loadedParts[loadedParts.length - 1] : null
            const nextPartNum = lastPart && lastPart.part ? (Number(lastPart.part) + 1) : 1
            const nextStartQ = lastPart && (lastPart.endQuestion || lastPart.endQuestion === 0) ? (Number(lastPart.endQuestion) + 1) : 1
            const nextEndQ = Number(nextStartQ) + 3
            setPartNumber(nextPartNum)
            setStartQuestion(nextStartQ)
            setEndQuestion(nextEndQ)
            setScriptPassage(null)
            setScriptText('')
            setScriptCollapsed(true)
            setCreatorDirty(false)
            setDirtyParts({})
          }
        } catch (e) {
          console.error(e)
          toast.error('Failed to load skill data')
        }
      }

  useEffect(() => {
    if (skillId) {
      
      fetchSkill()
    } else {
      // reset for new skill
      setLoadedSkill(null)
      setTitle('')
      setDescription('')
      setDuration(30)
      setParts([])
      setPartNumber(1)
      setStartQuestion(1)
      setEndQuestion(4)
      setScriptPassage(null)
      setScriptText('')
      setScriptCollapsed(true)
      setCreatorDirty(false)
      setDirtyParts({})
    }
  }, [skillId, url, token])

  const handleExerciseSave = (payload) => {
    if (selectedPartIndex === null) {
      toast.error('Chọn part để thêm exercise')
      return
    }
    const pAtSelected = parts[selectedPartIndex]
    // payload can be either a block or { block, imageBlock }
    let block = payload
    let imageBlock = null
    if (payload && payload.block) {
      block = payload.block
      imageBlock = payload.imageBlock || null
    }
    const isEditing = editingExercise && editingExercise.partIndex === selectedPartIndex && typeof editingExercise.exerciseIndex === 'number'

    setParts(prev => prev.map((p, idx) => {
      if (idx !== selectedPartIndex) return p
      // create instruction block using exercise-specific range
      const instructionBlock = {
        type: 'instruction',
        questionRange: `Questions ${exerciseStart}–${exerciseEnd}`,
        title: exerciseTitle,
        note: exerciseNote
      }

      const exerciseMeta = { startQuestion: Number(exerciseStart), endQuestion: Number(exerciseEnd), type: exerciseType, title: exerciseTitle, note: exerciseNote }

      if (isEditing) {
        // replace existing exercise blocks for the edited exercise
        const eIdx = editingExercise.exerciseIndex
        // locate the instruction block corresponding to this exercise by counting instruction blocks
        let instCount = -1
        let instIndex = null
        for (let j = 0; j < p.blocks.length; j++) {
          if (p.blocks[j]?.type === 'instruction') {
            instCount++
            if (instCount === eIdx) { instIndex = j; break }
          }
        }
        if (instIndex == null) {
          // fallback to matching by meta
          instIndex = p.blocks.findIndex(b => b.type === 'instruction' && b.questionRange === `Questions ${p.exercises[eIdx]?.startQuestion}–${p.exercises[eIdx]?.endQuestion}` && b.title === p.exercises[eIdx]?.title)
        }
        if (instIndex == null || instIndex === -1) {
          // cannot find instruction - append as fallback
          const newBlocks = [...p.blocks, instructionBlock]
          if (imageBlock) newBlocks.push(imageBlock)
          newBlocks.push(block)
          const newExercises = Array.isArray(p.exercises) ? [...p.exercises, exerciseMeta] : [exerciseMeta]
          toast.success('Exercise added to part ' + p.part)
          return { ...p, blocks: newBlocks, exercises: newExercises }
        }

        const hasImage = p.blocks[instIndex + 1] && p.blocks[instIndex + 1].type === 'image'
        const removeCount = hasImage ? 3 : 2
        const before = p.blocks.slice(0, instIndex)
        const after = p.blocks.slice(instIndex + removeCount)
        const inserted = [instructionBlock, ...(imageBlock ? [imageBlock] : []), block]
        const newBlocks = [...before, ...inserted, ...after]
        const newExercises = Array.isArray(p.exercises) ? p.exercises.map((ex, i) => i === eIdx ? exerciseMeta : ex) : [exerciseMeta]
        toast.success('Exercise updated in part ' + p.part)
        return { ...p, blocks: newBlocks, exercises: newExercises }
      }

      // not editing -> append as a new exercise
      const newBlocks = [...p.blocks, instructionBlock]
      if (imageBlock) newBlocks.push(imageBlock)
      newBlocks.push(block)
      const newExercises = Array.isArray(p.exercises) ? [...p.exercises, exerciseMeta] : [exerciseMeta]
      toast.success('Exercise added to part ' + p.part)
      return { ...p, blocks: newBlocks, exercises: newExercises }
    }))

    // mark the part as having unsaved changes (needs explicit Save Part)
    if (typeof selectedPartIndex === 'number') markPartDirty(selectedPartIndex)
    // creator is now saved into the part
    setCreatorDirty(false)

    if (!isEditing) {
      // advance default exercise start/end for subsequent adds — default end = start + 3 (clamped to part end)
      const nextStart = Number(exerciseEnd) + 1
      let nextEnd = nextStart + 3
      if (pAtSelected && Number(nextEnd) > Number(pAtSelected.endQuestion)) nextEnd = Number(pAtSelected.endQuestion)
      setExerciseStart(nextStart)
      setExerciseEnd(nextEnd)
    }

    // hide creator after saving and clear editing flag
    setEditingExercise(null)
    setSelectedPartIndex(null)
    creatorGetPayloadRef.current = null

    // reset creator fields to defaults so next use starts clean
    setExerciseType('note')
    setExerciseTitle(defaultExerciseTitles.note[0] || '')
    setExerciseNote('')
  }

  const performSelectPart = (idx) => {
    setSelectedPartIndex(idx)
    const p = parts[idx]
    if (!p) {
      setExerciseStart(Number(startQuestion || 1))
      setExerciseEnd(Number(startQuestion || 1) + 3)
      setEditingExercise(null)
      return
    }
    const last = Array.isArray(p.exercises) && p.exercises.length ? p.exercises[p.exercises.length - 1] : null
    let defStart = p.startQuestion || Number(startQuestion || 1)
    if (last && last.endQuestion) defStart = Number(last.endQuestion) + 1
    // default end is start + 3, but clamp to part end
    let defEnd = defStart + 3
    if (Number(defEnd) > Number(p.endQuestion)) defEnd = Number(p.endQuestion)
    setExerciseStart(defStart)
    setExerciseEnd(defEnd)
    setEditingExercise(null)
  }

  const handleSelectPart = (idx) => {
    if (selectedPartIndex !== null && selectedPartIndex !== idx) {
      const currentPart = parts[selectedPartIndex]
      if (creatorDirty || dirtyParts[selectedPartIndex]) {
        const saveFirst = window.confirm(`Part ${currentPart?.part} has unsaved changes. Click OK to save before switching, or Cancel to choose other options.`)
        if (saveFirst) {
          // if creator has payload, save it into the part first
          try {
            const payload = creatorGetPayloadRef.current ? creatorGetPayloadRef.current() : null
            if (creatorDirty && payload) handleExerciseSave(payload)
            handleSavePart(selectedPartIndex)
          } catch (err) {
            console.error(err)
          }
          performSelectPart(idx)
          return
        }
        const discard = window.confirm('Discard unsaved changes and continue? Click OK to discard, Cancel to stay.')
        if (discard) {
          setEditingExercise(null)
          setCreatorDirty(false)
          setDirtyParts(prev => { const copy = { ...prev }; delete copy[selectedPartIndex]; return copy })
          performSelectPart(idx)
          return
        }
        // user cancelled switching
        return
      }
    }
    performSelectPart(idx)
  }

  const populateCreatorForExercise = (partIdx, exIdx) => {
    const p = parts[partIdx]
    if (!p || !Array.isArray(p.exercises) || !p.exercises[exIdx]) return
    const meta = p.exercises[exIdx]
    
    // find instruction block by counting instruction blocks to match exercise index
    let instCount = -1
    let instIndex = null
    for (let j = 0; j < p.blocks.length; j++) {
      if (p.blocks[j]?.type === 'instruction') {
        instCount++
        if (instCount === exIdx) { instIndex = j; break }
      }
    }
    if (instIndex == null) {
      instIndex = p.blocks.findIndex(b => b.type === 'instruction' && b.questionRange === `Questions ${meta.startQuestion}–${meta.endQuestion}` && b.title === meta.title)
    }
    let imageBlock = null
    let exerciseBlock = null
    if (instIndex != null && instIndex > -1) {
      if (p.blocks[instIndex + 1] && p.blocks[instIndex + 1].type === 'image') {
        imageBlock = p.blocks[instIndex + 1]
        exerciseBlock = p.blocks[instIndex + 2]
      } else {
        exerciseBlock = p.blocks[instIndex + 1]
      }
    }

    setExerciseType(meta.type || 'note')
    setExerciseTitle(meta.title || defaultExerciseTitles[meta.type]?.[0] || '')
    setExerciseNote(meta.note || '')
    setExerciseStart(Number(meta.startQuestion))
    setExerciseEnd(Number(meta.endQuestion))
    setSelectedPartIndex(partIdx)
    setEditingExercise({ partIndex: partIdx, exerciseIndex: exIdx })
    
    // the actual child components will receive `initial` from the render scope
  }

  const handleEditExercise = (partIdx, exIdx) => {
    if (selectedPartIndex !== null && selectedPartIndex !== partIdx) {
      const currentPart = parts[selectedPartIndex]
      if (creatorDirty || dirtyParts[selectedPartIndex]) {
        const saveFirst = window.confirm(`Part ${currentPart?.part} has unsaved changes. Click OK to save before switching, or Cancel to choose other options.`)
        if (saveFirst) {
          const payload = creatorGetPayloadRef.current ? creatorGetPayloadRef.current() : null
          if (creatorDirty && payload) handleExerciseSave(payload)
          handleSavePart(selectedPartIndex)
          populateCreatorForExercise(partIdx, exIdx)
          return
        }
        const discard = window.confirm('Discard unsaved changes and continue? Click OK to discard, Cancel to stay.')
        if (discard) {
          setEditingExercise(null)
          setCreatorDirty(false)
          setDirtyParts(prev => { const copy = { ...prev }; delete copy[selectedPartIndex]; return copy })
          populateCreatorForExercise(partIdx, exIdx)
          return
        }
        return
      }
    }
    populateCreatorForExercise(partIdx, exIdx)
  }

  const handleSavePart = (idx) => {
    const p = parts[idx]
    if (!p) return
    console.log('Part saved:', JSON.stringify(p, null, 2))
    toast.success('Part object logged to console')
    // clear dirty flag for this part
    clearPartDirty(idx)
    // if creator was dirty and saving this part, clear creator dirty
    setCreatorDirty(false)

  }

  // Script editor states
  const [scriptText, setScriptText] = useState('')
  const [scriptPassage, setScriptPassage] = useState(null)
  const [scriptCollapsed, setScriptCollapsed] = useState(true)
  const [showScriptPopup, setShowScriptPopup] = useState(false)
  const [scriptEditingPartIndex, setScriptEditingPartIndex] = useState(null)
  const [scriptSplitMode, setScriptSplitMode] = useState('line') // 'line' | 'sentence'
  
  const splitIntoSentences = (t) => {
    if (!t) return []
    const m = String(t).match(/[^\.\!\?]+[\.\!\?]+["']?|[^\.\!\?]+$/g)
    if (!m) return [String(t).trim()]
    return m.map(s => s.trim()).filter(Boolean)
  }

  const createPassageFromText = (text, mode = 'line') => {
    const raw = (text || '')
    const paragraphsRaw = raw.split(/\r?\n\s*\r?\n/)
    const content = []
    const paragraphs = []
    let idx = 1

    if (mode === 'line') {
      // preserve explicit line breaks within each paragraph (keep trailing "\n" on items)
      paragraphsRaw.forEach(par => {
        const parIdx = []
        if (typeof par !== 'string' || par.length === 0) return
        const lines = par.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++) {
          const txt = lines[i] || ''
          const hasBreak = i < lines.length - 1
          const out = (txt === '' ? '' : txt) + (hasBreak ? '\n' : '')
          if (out.trim() === '') continue
          content.push({ index: idx, text: out })
          parIdx.push(idx)
          idx++
        }
        if (parIdx.length) paragraphs.push(parIdx)
      })
    } else if (mode === 'sentence') {
      // Split paragraph into physical lines first so explicit newlines become separate items.
      // Then split each line into sentences. If a line had a following newline, append a
      // trailing "\n" to the last sentence of that line so collapsed view can render a <br/>.
      paragraphsRaw.forEach(par => {
        const parIdx = []
        if (typeof par !== 'string' || par.length === 0) return
        const lines = par.split(/\r?\n/)
        for (let li = 0; li < lines.length; li++) {
          const line = lines[li] || ''
          const hasLineBreak = li < lines.length - 1
          if (line.trim() === '') {
            // empty line inside a paragraph — skip
            continue
          }
          const sents = splitIntoSentences(line)
          for (let si = 0; si < sents.length; si++) {
            let sText = sents[si] || ''
            // if this is the last sentence on a line that had a line break, mark it
            if (si === sents.length - 1 && hasLineBreak) sText = sText.trim() + '\n'
            if (sText.trim() === '') continue
            content.push({ index: idx, text: sText })
            parIdx.push(idx)
            idx++
          }
        }
        if (parIdx.length) paragraphs.push(parIdx)
      })
    }

    if (content.length === 0 && raw.trim() !== '') {
      content.push({ index: 1, text: raw.trim() })
      paragraphs.push([1])
    }

    return { title: '', raw, content, paragraphs }
  }
  
  // Answer key popup states
  const [showAnswerPopup, setShowAnswerPopup] = useState(false)
  const [answerEditingPartIndex, setAnswerEditingPartIndex] = useState(null)
  const [answerListDraft, setAnswerListDraft] = useState([])
  const [answerActiveIndex, setAnswerActiveIndex] = useState(0)
  const [openExplanationIndex, setOpenExplanationIndex] = useState(null)
  const [answerUnsaved, setAnswerUnsaved] = useState(false)

  const [loadedSkill, setLoadedSkill] = useState(null)

  const addPart = () => {
    const newPart = {
      part: Number(partNumber),
      startQuestion: Number(startQuestion),
      endQuestion: Number(endQuestion),
      exercises: [],
      blocks: [],
      answerKey: [],
      passage: null,
      audio: null
    }
    setParts(prev => [...prev, newPart])
    // advance partNumber and default start/end for next part: default length = +3
    const nextPart = Number(partNumber) + 1
    const nextStart = Number(endQuestion) + 1
    let nextEnd = nextStart + 3
    setPartNumber(nextPart)
    setStartQuestion(nextStart)
    setEndQuestion(nextEnd)
  }

  // uploader for audio/image files used by this component (uses StoreContext url/token)
  const uploadToServer = async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`${url}/api/upload`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
      return res.data.data
    } catch (err) {
      // rethrow for caller to handle
      throw err
    }
  }

  const handlePartAudioChange = async (idx, file) => {
    if (!file) return
    try {
      toast.info('Uploading audio...')
      const data = await uploadToServer(file)
      setParts(prev => prev.map((p, i) => i === idx ? ({ ...p, audio: data }) : p))
      markPartDirty(idx)
      toast.success('Audio uploaded')
    } catch (e) {
      console.error(e)
      toast.error('Audio upload failed')
    }
  }

  const handlePartPdfChange = async (idx, file) => {
      if (!file) return
      try {
        toast.info('Uploading PDF...')
        const formData = new FormData();

        formData.append("file", file);

        formData.append("testSkillId", skillId);
        formData.append("part", parts[idx]?.part || idx + 1);
        formData.append("startQuestion", parts[idx]?.startQuestion || 1);
        formData.append("endQuestion", parts[idx]?.endQuestion || 13);
        formData.append("type", "listening");

        await axios.post(
          `${url}/api/test/import-part`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${token}`
            }
          }
        );

        await fetchSkill() // refresh data after import
        toast.success('PDF uploaded')
      } catch (e) {
        console.error(e)
        toast.error('PDF upload failed')
      }
    }

  const buildBlockFromForm = () => {
    switch (blockType) {
      case 'instruction':
        return { type: 'instruction', questionRange: instrQuestionRange, title: instrTitle, note: instrNote }
      case 'note':
        return { type: 'note', heading: noteHeading, items: noteLinesText.filter(Boolean).map(line => ({ type: 'line', content: parseLineToContent(line) })) }
      case 'mcq':
        return { type: 'mcq', questions: mcqQuestions }
      case 'table':
        return {
          type: 'table',
          headers: tableHeadersText.split(',').map(h => h.trim()).filter(Boolean),
          rows: tableRowsText.filter(Boolean).map(r => r.split(',').map(cell => {
            const m = cell.match(/\[q:(\d+)\]/)
            return m ? { q: Number(m[1]) } : cell.trim()
          }))
        }
      case 'matching':
        return { type: 'matching', duplicate: false, options: matchingOptions.filter(o => o.text).map(o => ({ key: o.key, text: o.text })), questions: matchingQuestions.filter(q => q.q).map(q => ({ q: Number(q.q), label: q.label })) }
      case 'image':
        return { type: 'image', src: imageSrc, alt: imageAlt }
      default:
        return null
    }
  }

  const addBlockToPart = () => {
    if (selectedPartIndex === null) {
      toast.error('Chọn part trước khi thêm block')
      return
    }
    const block = buildBlockFromForm()
    if (!block) return
    setParts(prev => prev.map((p, idx) => idx === selectedPartIndex ? ({ ...p, blocks: [...p.blocks, block] }) : p))
  }

  // Save script textarea into a passage object (title ignored)
  const handleSaveScript = () => {
    const passage = createPassageFromText(scriptText, scriptSplitMode)

    if (scriptEditingPartIndex !== null && typeof scriptEditingPartIndex === 'number') {
      setParts(prev => prev.map((p, idx) => idx === scriptEditingPartIndex ? ({ ...p, passage }) : p))
      markPartDirty(scriptEditingPartIndex)
    } else if (selectedPartIndex !== null) {
      setParts(prev => prev.map((p, idx) => idx === selectedPartIndex ? ({ ...p, passage }) : p))
      markPartDirty(selectedPartIndex)
    } else {
      setScriptPassage(passage)
    }

    console.log('Script saved:', JSON.stringify(passage, null, 2))
    setScriptCollapsed(true)
    toast.success('Script saved')
  }

  // --- Answer key handlers ---
  const handleAnswerFieldChange = (index, field, value) => {
    setAnswerListDraft(prev => {
      const copy = prev.map(a => ({ q: a.q, answer: a.answer, explanation: { text: a.explanation?.text || '', refs: Array.isArray(a.explanation?.refs) ? [...a.explanation.refs] : [] } }))
      if (!copy[index]) return prev
      if (field === 'answer') {
        copy[index].answer = value
      } else if (field === 'refs') {
        // parse comma separated numbers
        const refs = (value || '').split(/[,\s]+/).map(s => Number(s)).filter(n => !Number.isNaN(n))
        copy[index].explanation.refs = refs
      } else if (field === 'text') {
        copy[index].explanation.text = value
      }
      setAnswerUnsaved(true)
      return copy
    })
  }

  const handleToggleScriptLineForActive = (lineIndex) => {
    if (answerActiveIndex == null) return
    setAnswerListDraft(prev => {
      const copy = prev.map(a => ({ q: a.q, answer: a.answer, explanation: { text: a.explanation?.text || '', refs: Array.isArray(a.explanation?.refs) ? [...a.explanation.refs] : [] } }))
      const item = copy[answerActiveIndex]
      if (!item) return prev
      const idx = item.explanation.refs.indexOf(lineIndex)
      if (idx === -1) item.explanation.refs.push(lineIndex)
      else item.explanation.refs.splice(idx, 1)
      setAnswerUnsaved(true)
      return copy
    })
  }

  const handleSaveAnswerList = () => {
    if (answerEditingPartIndex == null) return
    const partIdx = answerEditingPartIndex
    setParts(prev => prev.map((p, idx) => idx === partIdx ? ({ ...p, answerKey: JSON.parse(JSON.stringify(answerListDraft)) }) : p))
    markPartDirty(partIdx)
    console.log('Answer key saved for part', answerEditingPartIndex, JSON.stringify(answerListDraft, null, 2))
    toast.success('Answer key saved')
    setShowAnswerPopup(false)
    setAnswerEditingPartIndex(null)
    setAnswerUnsaved(false)
  }

  const handleCloseAnswerPopup = () => {
    if (answerUnsaved) {
      if (window.confirm('You have not saved answer list. Do you want to save it?')) {
        handleSaveAnswerList()
        return
      }
    }
    setShowAnswerPopup(false)
    setAnswerEditingPartIndex(null)
  }

  // keyboard navigation for answer list (up/down)
  useEffect(() => {
    if (!showAnswerPopup) return
    const onKey = (e) => {
      if (e.key === 'ArrowUp') {
        setAnswerActiveIndex(i => Math.max(0, (typeof i === 'number' ? i : 0) - 1))
        e.preventDefault()
      } else if (e.key === 'ArrowDown') {
        setAnswerActiveIndex(i => {
          const len = answerListDraft.length || 0
          return Math.min(len - 1, (typeof i === 'number' ? i : 0) + 1)
        })
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAnswerPopup, answerListDraft.length])

  // When active answer index changes inside the answer popup, focus the corresponding input.
  useEffect(() => {
    if (!showAnswerPopup) return
    if (typeof answerActiveIndex !== 'number') return
    try {
      const root = answerPopupRef.current
      if (!root) return
      const selector = `input[data-answer-input-index="${answerActiveIndex}"]`
      const el = root.querySelector(selector)
      if (el && typeof el.focus === 'function') {
        el.focus()
        // move caret to end
        try {
          const len = (el.value || '').length
          el.setSelectionRange(len, len)
        } catch (err) {
          // ignore if not supported
        }
      }
    } catch (err) {
      // ignore
    }
  }, [answerActiveIndex, showAnswerPopup])

  const handleScriptLineClick = (index, text) => {
    // for now just log; can be extended to support explanation UI
    console.log('script-line', index, text)
  }

  const currentPassage = (() => {
    if (scriptEditingPartIndex !== null && parts[scriptEditingPartIndex]?.passage) return parts[scriptEditingPartIndex].passage
    if (scriptPassage) return scriptPassage
    if (selectedPartIndex !== null && parts[selectedPartIndex]?.passage) return parts[selectedPartIndex].passage
    return createPassageFromText(scriptText, scriptSplitMode)
  })()

  const scriptContentCount = Array.isArray(currentPassage?.content) ? currentPassage.content.length : 0

  const renderPassageDisplay = (passage, { highlightIndices = [], onItemClick = null, collapsed = false } = {}) => {
    const content = Array.isArray(passage?.content) ? passage.content : []
    const paragraphs = (collapsed
      ? (content.length ? [content.map(c => c.index)] : [])
      : (Array.isArray(passage?.paragraphs) && passage.paragraphs.length ? passage.paragraphs : (content.length ? [content.map(c => c.index)] : []))
    )
    const contentMap = {}
    content.forEach(c => { contentMap[c.index] = c.text })

    return (
      <div>
        {paragraphs.map((para, pIdx) => (
          <div key={'para-' + pIdx} className="ltm_script_paragraph" style={{ marginBottom: 12, lineHeight: 1.7 }}>
            {para.map((ci, i) => {
              const rawText = contentMap[ci] || ''
              // collapsed view: render continuous paragraph — items joined, only break where original had explicit newline
              if (collapsed) {
                const isActive = Array.isArray(highlightIndices) && highlightIndices.includes(ci)
                const segments = String(rawText || '').split(/\r?\n/)
                return (
                  <React.Fragment key={ci}>
                    {segments.map((seg, sidx) => (
                      <React.Fragment key={`${ci}-${sidx}`}>
                        {seg !== '' && (
                          <span
                            className={`ltm_script_sentence ${isActive ? 'active' : ''}`}
                            onClick={() => onItemClick && onItemClick(ci, seg)}
                            style={{ display: 'inline' }}
                          >
                            {seg}
                          </span>
                        )}
                        {sidx < segments.length - 1 ? <br /> : (i < para.length - 1 ? ' ' : '')}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                )
              }

              // non-collapsed (editing / preview) behaviour — keep previous rendering logic
              const text = rawText
              if (scriptSplitMode === 'line') {
                const sents = splitIntoSentences(text)
                return (
                  <span key={`${ci}-${i}`} style={{ display: 'inline-block' }}>
                    {sents.map((s, si) => (
                      <span key={`${ci}-${si}`} className="ltm_script_sentence" onClick={() => onItemClick && onItemClick(ci, s)}>{s}{si < sents.length - 1 ? ' ' : ''}</span>
                    ))}
                    <br />
                  </span>
                )
              }
              const isActive = Array.isArray(highlightIndices) && highlightIndices.includes(ci)
              return (
                <span key={ci} className="ltm_script_sentence" onClick={() => onItemClick && onItemClick(ci, text)} style={{ backgroundColor: isActive ? '#fff2a8' : 'transparent', padding: '2px 4px', borderRadius: 4, marginRight: 6 }}>
                  {text}{' '}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const createTest = async () => {
    if (!title.trim()) {
      toast.error('Tiêu đề test không được để trống')
      return
    }
    const payload = { testCollectionId: testCollection._id, type: 'listening', title, description, duration: Number(duration), parts }
    try {
        const res = await axios.post(`${url}/api/test/skills`, payload, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data?.success) {
          toast.success('Created listening test')
          setScriptCollapsed(false)
          setCreatorDirty(false)
          setDirtyParts({})
          setCollectionSkills(prev => [...prev, res.data.data])
        } else {
          toast.error('Lỗi tạo test')
        }
    } catch (e) {
      console.error(e)
      toast.error('Lỗi tạo test')
    }
  }
  const handleSaveOrCreate = () => {
    if (skillId) updateTest()
    else createTest()
    fetchSkill() // refresh data after save/create
  }

  const updateTest = () => {
    if (!title.trim()) {
      toast.error('Tiêu đề test không được để trống')
      return
    }
    const payload = { testCollectionId: testCollection._id, type: 'listening', title, description, duration: Number(duration), parts }
    
      axios.put(`${url}/api/test/skills/${skillId}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.data?.success) {
            toast.success('Updated listening test')
          } else {
            toast.error('Lỗi cập nhật test')
          }
        })
        .catch(e => {
          console.error(e)
          toast.error('Lỗi cập nhật test')
        })
  }

  // handlers for exercise range inputs — validate against selected part and previous exercises
  const handleExerciseStartInputChange = (value) => {
    if (selectedPartIndex === null) {
      setExerciseStart(Number(value) || 1)
      return
    }
    const p = parts[selectedPartIndex]
    if (!p) return
    const editing = editingExercise && editingExercise.partIndex === selectedPartIndex
    const prev = editing ? (p.exercises && p.exercises[editing.exerciseIndex - 1] ? Number(p.exercises[editing.exerciseIndex - 1].endQuestion) : Number(p.startQuestion)) : (Array.isArray(p.exercises) && p.exercises.length ? Number(p.exercises[p.exercises.length - 1].endQuestion) : Number(p.startQuestion))
    const min = prev ? Number(prev) + (prev ? 1 : 0) : Number(p.startQuestion)
    const nextLimit = editing ? (p.exercises && p.exercises[editing.exerciseIndex + 1] ? Number(p.exercises[editing.exerciseIndex + 1].startQuestion) - 1 : Number(p.endQuestion)) : Number(p.endQuestion)
    let v = Number(value)
    if (isNaN(v)) v = min
    if (v < min) v = min
    if (v > nextLimit) v = nextLimit
    setExerciseStart(v)
    if (Number(exerciseEnd) < v) setExerciseEnd(v)
  }

  const handleExerciseEndInputChange = (value) => {
    if (selectedPartIndex === null) {
      setExerciseEnd(Number(value) || Number(exerciseStart))
      return
    }
    const p = parts[selectedPartIndex]
    if (!p) return
    const editing = editingExercise && editingExercise.partIndex === selectedPartIndex
    const nextLimit = editing ? (p.exercises && p.exercises[editing.exerciseIndex + 1] ? Number(p.exercises[editing.exerciseIndex + 1].startQuestion) - 1 : Number(p.endQuestion)) : Number(p.endQuestion)
    let v = Number(value)
    if (isNaN(v)) v = Number(exerciseStart)
    if (v < Number(exerciseStart)) v = Number(exerciseStart)
    if (v > nextLimit) v = nextLimit
    setExerciseEnd(v)
  }

  // part controls: prevent new part start overlapping previous part
  const handlePartStartChange = (value) => {
    const prevEnd = parts.length ? Number(parts[parts.length - 1].endQuestion) : 0
    const min = prevEnd ? prevEnd + 1 : 1
    let v = Number(value)
    if (isNaN(v) || v < min) v = min
    setStartQuestion(v)
    if (Number(endQuestion) < v) setEndQuestion(v + 3)
  }

  // warn before unload (closing tab / refresh)
  useEffect(() => {
    const handler = (e) => {
      if (creatorDirty || Object.keys(dirtyParts).length > 0) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
      return undefined
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [creatorDirty, dirtyParts])

  // intercept client-side navigation (route changes)
  // useEffect(() => {
  //   if (prevLocationRef.current && prevLocationRef.current !== location.pathname) {
  //     if (creatorDirty || Object.keys(dirtyParts).length > 0) {
  //       const saveFirst = window.confirm('You have unsaved changes. Click OK to save and continue, or Cancel to choose other options.')
  //       if (saveFirst) {
  //         handleSaveOrCreate()
  //       } else {
  //         const discard = window.confirm('Discard unsaved changes and continue? Click OK to discard, Cancel to stay.')
  //         if (discard) {
  //           setCreatorDirty(false)
  //           setDirtyParts({})
  //         } else {
  //           navigate(prevLocationRef.current)
  //         }
  //       }
  //     }
  //   }
  //   prevLocationRef.current = location.pathname
  // }, [location.pathname])

  // detect switching testCollection (parent changed selection)
  useEffect(() => {
    const prev = prevTestCollectionRef.current
    const next = testCollection?._id
    if (prev && prev !== next) {
      if (creatorDirty || Object.keys(dirtyParts).length > 0) {
        const saveFirst = window.confirm('You have unsaved changes in this test collection. Click OK to save, Cancel to choose other options.')
        if (saveFirst) {
          handleSaveOrCreate()
        } else {
          const discard = window.confirm('Discard unsaved changes and continue? Click OK to discard, Cancel to stay.')
          if (discard) {
            setCreatorDirty(false)
            setDirtyParts({})
          } else {
            navigate(-1)
          }
        }
      }
    }
    prevTestCollectionRef.current = next
  }, [testCollection?._id])

  const handlePartEndChange = (value) => {
    let v = Number(value)
    if (isNaN(v)) v = Number(startQuestion) + 3
    if (v < Number(startQuestion)) v = Number(startQuestion)
    setEndQuestion(v)
  }

  const handleDeletePart = async (id) => {
    if (confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      await axios.delete(`${url}/api/test/skills/${skillId}/parts/${id}`, { headers: {
        'Authorization': `Bearer ${token}`
      } })
      setParts(prev => prev.filter(p => p._id !== id))
    }
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
          <input className="ltm_input ltm_duration_input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder='(minutes)'/>
        </div>

        <button className="ltm_btn ltm_primary" onClick={handleSaveOrCreate}>{skillId ? 'Save Listening Test' : 'Create Listening Test'}</button>
      </div>

      {skillId&&
      <div className="ltm_listening_container">

      <div className="ltm_part_builder">
        <div className="ltm_parts_list">
          {parts.map((p, idx) => (
            <div key={idx} className="ltm_part_card">
              <div className="ltm_part_header">
                <div className="ltm_part_header_left">
                  <strong>Part {p.part}</strong>
                  <div>Questions {p.startQuestion} - {p.endQuestion}</div>
                </div>
                <div className="ltm_part_header_right" style={{ display: 'flex', gap: "12px", alignItems: 'center' }}>
                  <div className="ltm_header_field ltm_add_audio">
                    <label>Audio</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {!p.audio?.url && (
                        <label htmlFor={`add_audio_file_${idx}`} style={{ cursor: 'pointer' }}>
                          <FilePlusCorner size={18} />
                        </label>
                      )}
                      <input hidden id={`add_audio_file_${idx}`} className="ltm_input ltm_file_input" type="file" accept="audio/*" onChange={(e) => handlePartAudioChange(idx, e.target.files[0])} />
                      {p.audio?.url && (
                        <>
                          <audio controls src={p.audio.url} style={{ maxWidth: 220, width: '150px' }} />
                          <button className="ltm_btn" onClick={() => document.getElementById(`add_audio_file_${idx}`)?.click()}>Update</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="ltm_header_field ltm_add_audio"
                    onClick={() => {
                      // open script popup for this part (do not change selectedPartIndex)
                      const partPassage = parts[idx]?.passage
                      setScriptEditingPartIndex(idx)
                      setScriptText(partPassage ? (partPassage.raw || partPassage.content.map(c => c.text).join(" ")) : '')
                      // attempt to infer saved split mode from saved passage (prefer line if any item has trailing newline)
                      if (partPassage) {
                        const anyLineBreakItem = Array.isArray(partPassage.content) && partPassage.content.some(ci => String(ci.text || '').endsWith('\n'))
                        setScriptSplitMode(anyLineBreakItem ? 'line' : 'sentence')
                      }
                      setScriptCollapsed(!!partPassage)
                      setShowScriptPopup(true)
                    }}
                  >
                    <label>Script</label>
                    <ScrollText size={18} />
                  </div>
                  <div className="ltm_header_field ltm_add_audio" onClick={() => {
                      // open answer key popup for this part
                      const p = parts[idx] || {}
                      const start = Number(p.startQuestion) || 1
                      const end = Number(p.endQuestion) || start
                      const existing = Array.isArray(p.answerKey) ? p.answerKey : []
                      const list = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => {
                        const qnum = start + i
                        const found = existing.find(a => Number(a.q) === qnum)
                        return found ? JSON.parse(JSON.stringify(found)) : { q: qnum, answer: '', explanation: { text: '', refs: [] } }
                      })
                      setAnswerListDraft(list)
                      setAnswerActiveIndex(0)
                      setOpenExplanationIndex(null)
                      setAnswerEditingPartIndex(idx)
                      setShowAnswerPopup(true)
                      setAnswerUnsaved(false)
                    }}
                  >
                    <label>Answer Key</label>
                    <ALargeSmall size={18} />
                  </div>
                  {!p._id&&(
                   <div className="ltm_header_field ltm_add_audio">
                    <label>File PDF</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label htmlFor={`add_pdf_file_${idx}`} style={{ cursor: 'pointer' }}>
                        <FilePlusCorner size={18} />
                      </label>
                      <input hidden id={`add_pdf_file_${idx}`} className="ltm_input ltm_file_input" type="file" accept="application/pdf" onChange={(e) => handlePartPdfChange(idx, e.target.files[0])} />
                    </div>
                   </div>)}
                   {p._id && (
                     <Trash2 size={18} style={{ cursor: 'pointer', color: '#ff6b6b' }} onClick={() => handleDeletePart(p._id)} />
                   )}
                  <button className="ltm_btn ltm_primary" onClick={() => handleSavePart(idx)}>Save Part</button>
                </div>
              </div>

              <div className="ltm_part_body">

                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="ltm_btn"
                    disabled={
                      (Array.isArray(p.exercises) && p.exercises.length)
                        ? Number(p.exercises[p.exercises.length - 1].endQuestion) >= Number(p.endQuestion)
                        : Number(p.startQuestion) > Number(p.endQuestion)
                    }
                    onClick={() => handleSelectPart(idx)}
                  >+ Add Exercise</button>
                  {((Array.isArray(p.exercises) && p.exercises.length)
                    ? Number(p.exercises[p.exercises.length - 1].endQuestion) >= Number(p.endQuestion)
                    : Number(p.startQuestion) > Number(p.endQuestion)) && (
                      <div style={{ fontSize: 12, color: '#888' }}>All questions used</div>
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>Exercises</strong>
                  <div>
                    {(p.exercises || []).map((ex, ei) => (
                      <div key={ei} style={{ padding: 8, borderRadius: 6, background: '#fff', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div><strong>{ex.title}</strong> — Questions {ex.startQuestion} - {ex.endQuestion}</div>
                          <div style={{ fontSize: 12, color: '#555' }}>{ex.type} {ex.note ? `· ${ex.note}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="ltm_btn" onClick={() => handleEditExercise(idx, ei)}>Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPartIndex === idx && (
                  (() => {
                    // compute editing initial block and min/max constraints
                    let editingInitial = null
                    let prevMin = (Array.isArray(p.exercises) && p.exercises.length) ? Number(p.exercises[p.exercises.length - 1].endQuestion) + 1 : Number(p.startQuestion)
                    let maxLimit = Number(p.endQuestion)
                    if (editingExercise && editingExercise.partIndex === idx) {
                      const eIdx = editingExercise.exerciseIndex
                      prevMin = eIdx > 0 ? Number(p.exercises[eIdx - 1].endQuestion) + 1 : Number(p.startQuestion)
                      maxLimit = p.exercises[eIdx + 1] ? Number(p.exercises[eIdx + 1].startQuestion) - 1 : Number(p.endQuestion)
                      // find instruction block index for this exercise
                      let instCount = -1
                      let instIndex = null
                      for (let j = 0; j < p.blocks.length; j++) {
                        if (p.blocks[j]?.type === 'instruction') {
                          instCount++
                          if (instCount === eIdx) { instIndex = j; break }
                        }
                      }
                      if (instIndex == null) {
                        const meta = p.exercises[eIdx]
                        instIndex = p.blocks.findIndex(b => b.type === 'instruction' && b.questionRange === `Questions ${meta.startQuestion}–${meta.endQuestion}` && b.title === meta.title)
                      }
                      if (instIndex != null && instIndex > -1) {
                        let imageBlock = null
                        let exerciseBlock = null
                        if (p.blocks[instIndex + 1] && p.blocks[instIndex + 1].type === 'image') {
                          imageBlock = p.blocks[instIndex + 1]
                          exerciseBlock = p.blocks[instIndex + 2]
                        } else {
                          exerciseBlock = p.blocks[instIndex + 1]
                        }
                        editingInitial = { block: exerciseBlock, imageBlock }
                      }
                    }

                  return (
                  <div className="ltm_exercise_creator" style={{ marginTop: 12, padding: 10, border: '1px dashed var(--ltm-border)', borderRadius: 8, background: '#fff' }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>Exercise Creator</p>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ marginRight: 6 }}>Range:</label>
                      <input
                        className="ltm_small_input"
                        type="number"
                        value={exerciseStart}
                        onChange={e => handleExerciseStartInputChange(e.target.value)}
                        min={prevMin}
                        max={maxLimit}
                      />
                      <input
                        className="ltm_small_input"
                        type="number"
                        value={exerciseEnd}
                        onChange={e => handleExerciseEndInputChange(e.target.value)}
                        min={exerciseStart}
                        max={maxLimit}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <select className="ltm_select" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                        <option value="note">Note / Complete the notes</option>
                        <option value="table">Table</option>
                        <option value="mcq">Multiple Choice (MCQ)</option>
                        <option value="matching">Matching</option>
                      </select>
                      <select className="ltm_select" value={exerciseTitle} onChange={e => setExerciseTitle(e.target.value)}>
                        {defaultExerciseTitles[exerciseType].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <input className="ltm_input" placeholder="Instruction note (e.g., Use NO MORE THAN THREE WORDS)" value={exerciseNote} onChange={e => setExerciseNote(e.target.value)} />
                    <div style={{ marginTop: "8px" }}>
                      {/* normalize initial shape per child: MCQ expects questions on root, others expect { block, imageBlock } */}
                      {(() => {
                        const exBlock = editingInitial?.block || null
                        const imageBlock = editingInitial?.imageBlock || null
                        const initialForMCQ = exBlock ? { ...(exBlock), imageBlock } : null
                        const initialForOthers = exBlock ? { block: exBlock, imageBlock } : null

                        return (
                          <>
                            {exerciseType === 'note' && <NoteExercise onSave={handleExerciseSave} initial={initialForOthers} registerGetPayload={registerCreatorGetPayload} onDirtyChange={(d) => setCreatorDirty(!!d)} />}
                            {exerciseType === 'table' && <TableExercise onSave={handleExerciseSave} initial={initialForOthers} registerGetPayload={registerCreatorGetPayload} onDirtyChange={(d) => setCreatorDirty(!!d)} />}
                            {exerciseType === 'mcq' && <MCQExercise questionStart={exerciseStart} questionEnd={exerciseEnd} title={exerciseTitle} onSave={handleExerciseSave} initial={initialForMCQ} registerGetPayload={registerCreatorGetPayload} onDirtyChange={(d) => setCreatorDirty(!!d)} />}
                            {exerciseType === 'matching' && <MatchingExercise questionStart={exerciseStart} questionEnd={exerciseEnd} onSave={handleExerciseSave} initial={initialForOthers} registerGetPayload={registerCreatorGetPayload} onDirtyChange={(d) => setCreatorDirty(!!d)} />}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  )
                })()
                )}

                

                <div className="ltm_blocks_preview">
                  <strong style={{display:"flex", alignItems:"center", gap:"8px"}}>Preview {showExercisePreview[idx] ? <ChevronUp onClick={()=>setShowExercisePreview(prev => ({ ...prev, [idx]: false }))}/> : <ChevronDown onClick={()=>setShowExercisePreview(prev => ({ ...prev, [idx]: true }))}/>}</strong>
                  <div className={`ltm_blocks_preview_container ${showExercisePreview[idx]? 'ltm_open' : ''}`}>
                    <ListeningRenderer blocks={p.blocks || []} answers={{}} onChange={() => {}} />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
        <div className="ltm_part_controls">
          <div className="ltm_small_input" type="number" >Part {partNumber}</div>
          <input
            className="ltm_small_input"
            type="number"
            value={startQuestion}
            onChange={e => handlePartStartChange(e.target.value)}
            min={parts.length ? Number(parts[parts.length - 1].endQuestion) + 1 : 1}
          />
          <input className="ltm_small_input" type="number" value={endQuestion} onChange={e => handlePartEndChange(e.target.value)} />
          <button className="ltm_btn ltm_add_part_btn" onClick={addPart}>+ Add Part</button>
        </div>
      </div>

      <div className="ltm_save_row">
      </div>

      <div className={`ltm_script_popup ${showScriptPopup ? 'ltm_open' : ''}`}>
        <div className="ltm_script_popup_header">
          <h4>Script ({scriptContentCount} items)</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!scriptCollapsed && (
              <div className="ltm_split_mode">
                <button className={`ltm_btn ${scriptSplitMode === 'line' ? 'ltm_primary' : ''}`} onClick={() => setScriptSplitMode('line')}>Theo dòng</button>
                <button className={`ltm_btn ${scriptSplitMode === 'sentence' ? 'ltm_primary' : ''}`} onClick={() => setScriptSplitMode('sentence')}>Theo câu</button>
              </div>
            )}
            {!scriptCollapsed ? <button className="ltm_btn ltm_primary" onClick={handleSaveScript}>Save Script</button> : <button className="ltm_btn" onClick={() => setScriptCollapsed(false)}>Edit</button>}
          </div>
        </div>
        <div className="ltm_script_popup_body">
          {!scriptCollapsed ? (
            <div>
              <textarea className="ltm_script_textarea" value={scriptText} onChange={(e) => setScriptText(e.target.value)} placeholder="Paste script lines, one per line or paste full passage" />
              <div className="ltm_script_actions">
                <button className="ltm_btn" onClick={() => setScriptText('')}>Clear</button>
              </div>
            </div>
          ) : renderPassageDisplay(currentPassage, { onItemClick: handleScriptLineClick, collapsed: true })}
          {}
        </div>
        <div className="ltm_script_popup_footer">
          <button className="ltm_btn" onClick={() => { setShowScriptPopup(false); setScriptCollapsed(true); setScriptEditingPartIndex(null); }}>Close</button>
        </div>
      </div>
      
      {/* Answer key popup (two-pane): left = answer list, right = non-editable script lines for that part */}
      {showAnswerPopup && (
        <div className={`ltm_answer_popup ltm_open`} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '58%', background: '#fff',  zIndex: 2200, display: 'flex', height: '100%' }}>
          <div ref={answerPopupRef} style={{  borderLeft: '1px solid #eee',  position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="ltm_script_popup_header">
              <h4 style={{ margin: 0 }}>Answer Key (Part {answerEditingPartIndex != null ? parts[answerEditingPartIndex]?.part : ''})</h4>
              <button className="ltm_btn ltm_primary" onClick={handleSaveAnswerList}>Save</button>
            </div>

            <div className="ltm_script_popup_body">
              {answerListDraft.map((ans, i) => (
                <div key={ans.q} onClick={() => setAnswerActiveIndex(i)} style={{ padding: 8, borderRadius: 6, background: answerActiveIndex === i ? '#eef6ff' : '#fff', marginBottom: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 30, fontWeight: 600 }}>{ans.q}.</div>
                      <input data-answer-input-index={i} autoFocus={answerActiveIndex === i ? true : false} className="ltm_input" placeholder="Answer" style={{ flex: 1, maxWidth: '170px' }} value={ans.answer || ''} onChange={e => handleAnswerFieldChange(i, 'answer', e.target.value)} />
                    <input className="ltm_input" placeholder="Refs (e.g. 1,3,5)" style={{ width: 140 }} value={Array.isArray(ans.explanation?.refs) ? ans.explanation.refs.join(', ') : ''} onChange={e => handleAnswerFieldChange(i, 'refs', e.target.value)} />
                    <div style={{ cursor: 'pointer' }} title="Add Explanation Text"><PlusCircle size={18} onClick={(ev) => { ev.stopPropagation(); setAnswerActiveIndex(i); setOpenExplanationIndex(openExplanationIndex === i ? null : i); }} /></div>
                  </div>
                  {openExplanationIndex === i && (
                    <div style={{ marginTop: 8 }}>
                      <textarea className="ltm_textarea" placeholder="Explanation text" value={ans.explanation?.text || ''} onChange={e => handleAnswerFieldChange(i, 'text', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="ltm_script_popup_footer">
              <button className="ltm_btn" onClick={handleCloseAnswerPopup}>Close</button>
            </div>
          </div>
          
          {(() => {
            const partPassage = (answerEditingPartIndex != null && parts[answerEditingPartIndex]) ? parts[answerEditingPartIndex].passage : null
            if (!partPassage || !Array.isArray(partPassage.content) || partPassage.content.length === 0) return <div style={{ color: '#888' }}>No script saved for this part.</div>
            const activeRefs = (answerListDraft[answerActiveIndex] && Array.isArray(answerListDraft[answerActiveIndex].explanation?.refs)) ? answerListDraft[answerActiveIndex].explanation.refs : []
            return (
              <div style={{ width: '380px',  height: '100%', display: 'flex', flexDirection: 'column' , borderLeft: '1px solid #eee',}}>
                <div className="ltm_script_popup_header" >
                  <h4>Script ({partPassage.content.length} lines)</h4>
                  <button className="ltm_btn" style={{ visibility: 'hidden' }} onClick={() => setScriptCollapsed(false)}>Edit</button>
                </div>
                <div className="ltm_script_popup_body">
                      {renderPassageDisplay(partPassage, { highlightIndices: activeRefs, onItemClick: (ci) => handleToggleScriptLineForActive(ci), collapsed: true })}
                    </div>
                <div className="ltm_script_popup_footer">
                </div>
              </div>
              )
          })()}
        </div>
      )}
      </div>
      }
    </div>
  )
}

export default ListeningTestManagement
