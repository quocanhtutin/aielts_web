import React, { useState, useContext, useEffect, useRef } from 'react'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import './ListeningTestManagement.css'
import { Pen, PenOff, FilePlusCorner, FileHeadphone, ScrollText, ChevronDown,ChevronUp } from 'lucide-react'
import ListeningRenderer from '../Testing/ListeningRenderer'

const defaultBlockTypes = ["instruction", "note", "mcq", "table", "matching", "image"]

// generic uploader that posts a `file` field to /api/upload on the backend
const uploadToServer = async (file, baseUrl, token) => {
  const form = new FormData()
  form.append('file', file)
  const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  const res = await axios.post(`${baseUrl}/api/upload`, form, headers)
  return res.data
}
  const contentPartsToString = (parts) => {
    if (parts == null) return ''
    if (typeof parts === 'string') return parts
    if (Array.isArray(parts)) return parts.map(p => typeof p === 'string' ? p : (p && p.q ? `(question_${p.q})` : '')).join(' ')
    if (typeof parts === 'object' && parts.q) return `(question_${parts.q})`
    return ''
  }

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

    // Note exercise component: user provides optional heading and a textarea where each line becomes an item
  export const NoteExercise = ({ onSave, initial, registerGetPayload, onDirtyChange }) => {
    const [heading, setHeading] = useState(initial?.block?.heading || '')
    const [text, setText] = useState(() => {
      if (!initial || !initial.block || !initial.block.items) return ''
      return initial.block.items.map(it => contentPartsToString(it.content)).join('\n')
    })
    const [imageSrcLocal, setImageSrcLocal] = useState(initial?.imageBlock?.src || '')
    const [imageAltLocal, setImageAltLocal] = useState(initial?.imageBlock?.alt || '')
    const { url, token } = useContext(StoreContext)
    const fileRef = useRef(null)
    const markDirty = () => onDirtyChange && onDirtyChange(true)

    const handleSave = () => {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const items = lines.map(line => ({ type: 'line', content: parseQuestionPlaceholdersToArray(line) }))
      const block = { type: 'note', heading, items }
      const imageBlock = imageSrcLocal ? { type: 'image', src: imageSrcLocal, alt: imageAltLocal } : null
      // allow both forms: block or { block, imageBlock }
      onSave(imageBlock ? { block, imageBlock } : block)
      onDirtyChange && onDirtyChange(false)
    }

    useEffect(() => {
      if (!registerGetPayload) return
      const getter = () => {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const items = lines.map(line => ({ type: 'line', content: parseQuestionPlaceholdersToArray(line) }))
        const block = { type: 'note', heading, items }
        const imageBlock = imageSrcLocal ? { type: 'image', src: imageSrcLocal, alt: imageAltLocal } : null
        return imageBlock ? { block, imageBlock } : block
      }
      registerGetPayload(getter)
      return () => registerGetPayload(null)
    }, [heading, text, imageSrcLocal, imageAltLocal, registerGetPayload])

    return (
      <div className="ltm_note_exercise">
        <div style={{ marginBottom: 8 }}>
          <input className="ltm_input" placeholder="Heading (optional)" value={heading} onChange={e => { setHeading(e.target.value); markDirty() }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          {imageSrcLocal ? (
            <>
              <img src={imageSrcLocal.url} alt={imageAltLocal} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              <button className="ltm_btn" onClick={() => fileRef.current?.click()}>Update</button>
              <button className="ltm_btn" onClick={() => { setImageSrcLocal(''); setImageAltLocal(''); markDirty() }}>Remove</button>
            </>
          ) : (
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files && e.target.files[0]
              if (!f) return
              try {
                toast.info('Uploading image...')
                const data = await uploadToServer(f, url, token)
                const imgUrl = data?.url || data.data
                setImageSrcLocal(imgUrl)
                markDirty()
                toast.success('Image uploaded')
              } catch (err) {
                console.error(err)
                toast.error('Image upload failed')
              }
            }} />
          )}
          <input className="ltm_input" placeholder="Alt text" value={imageAltLocal} onChange={e => { setImageAltLocal(e.target.value); markDirty() }} />
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
            const f = e.target.files && e.target.files[0]
            if (!f) return
            try {
              toast.info('Uploading image...')
              const data = await uploadToServer(f, url, token)
              const imgUrl = data?.url || data.data
              setImageSrcLocal(imgUrl)
              markDirty()
              toast.success('Image uploaded')
            } catch (err) {
              console.error(err)
              toast.error('Image upload failed')
            }
          }} />
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:"8px", marginTop: "12px"}}>
          <em>Items (one per line). Use (question_XX) as placeholder.</em>
          <textarea className="ltm_textarea" value={text} onChange={e => { setText(e.target.value); markDirty() }} placeholder={`Line1\nLine2 with (question_12)`}></textarea>
        </div>
        <div style={{ marginTop: 8 }}>
            <button className="ltm_btn ltm_primary" onClick={handleSave}>Save Note Exercise</button>
        </div>
      </div>
    )
  }


  // Table exercise component: create grid based on rows/cols then fill cell textareas
  export const TableExercise = ({ onSave, initial, registerGetPayload, onDirtyChange }) => {
    const [rowsNum, setRowsNum] = useState(3)
    const [colsNum, setColsNum] = useState(3)
    const [gridCreated, setGridCreated] = useState(false)
    const [grid, setGrid] = useState([]) // array of rows, each row array of cell text
    const [imageSrcLocal, setImageSrcLocal] = useState(initial?.imageBlock?.src || '')
    const [imageAltLocal, setImageAltLocal] = useState(initial?.imageBlock?.alt || '')
    const { url, token } = useContext(StoreContext)
    const fileRef = useRef(null)
    const markDirty = () => onDirtyChange && onDirtyChange(true)

    useEffect(() => {
      if (initial && initial.block && initial.block.type === 'table') {
        const headers = initial.block.headers || []
        const rows = initial.block.rows || []
        const full = [headers, ...rows.map(r => r.map(cell => Array.isArray(cell) ? contentPartsToString(cell) : (typeof cell === 'object' && cell.q ? `(question_${cell.q})` : (cell || ''))))]
        const rcount = full.length
        const ccount = Math.max(...full.map(row => row.length))
        const g = Array.from({ length: rcount }, (_, i) => Array.from({ length: ccount }, (_, j) => full[i][j] || ''))
        setGrid(g)
        setGridCreated(true)
        setRowsNum(rcount)
        setColsNum(ccount)
      }
    }, [initial])

    const createGrid = () => {
      const r = Math.max(1, Number(rowsNum))
      const c = Math.max(1, Number(colsNum))
      const g = Array.from({ length: r }, () => Array.from({ length: c }, () => ''))
      setGrid(g)
      setGridCreated(true)
      markDirty()
    }

    const modifyGrid = () => { setGridCreated(false); markDirty() }

    const updateCell = (ri, ci, value) => {
      setGrid(prev => {
        const copy = prev.map(row => [...row])
        copy[ri][ci] = value
        return copy
      })
      markDirty()
    }

    const handleSave = () => {
      if (!gridCreated || grid.length === 0) return
      const headers = grid[0].map(h => h.trim())
      const rows = grid.slice(1).map(row => row.map(cell => {
        const parts = parseQuestionPlaceholdersToArray(cell || '')
        // if parts contain placeholders or multiple parts, return array; otherwise a trimmed string
        const hasPlaceholder = parts.some(p => typeof p !== 'string')
        if (hasPlaceholder || parts.length > 1) return parts
        return (parts[0] || '').toString()
      }))
      const block = { type: 'table', headers, rows }
      const imageBlock = imageSrcLocal ? { type: 'image', src: imageSrcLocal, alt: imageAltLocal } : null
      onSave(imageBlock ? { block, imageBlock } : block)
    }

    useEffect(() => {
      if (!registerGetPayload) return
      const getter = () => {
        if (!gridCreated || grid.length === 0) return null
        const headers = grid[0].map(h => h.trim())
        const rows = grid.slice(1).map(row => row.map(cell => {
          const parts = parseQuestionPlaceholdersToArray(cell || '')
          const hasPlaceholder = parts.some(p => typeof p !== 'string')
          if (hasPlaceholder || parts.length > 1) return parts
          return (parts[0] || '').toString()
        }))
        const block = { type: 'table', headers, rows }
        const imageBlock = imageSrcLocal ? { type: 'image', src: imageSrcLocal, alt: imageAltLocal } : null
        return imageBlock ? { block, imageBlock } : block
      }
      registerGetPayload(getter)
      return () => registerGetPayload(null)
    }, [grid, gridCreated, imageSrcLocal, imageAltLocal, registerGetPayload])

    return (
      <div className="ltm_table_exercise">
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          {imageSrcLocal ? (
            <>
              <img src={imageSrcLocal.url} alt={imageAltLocal} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              <button className="ltm_btn" onClick={() => fileRef.current?.click()}>Update</button>
              <button className="ltm_btn" onClick={() => { setImageSrcLocal(''); setImageAltLocal('') }}>Remove</button>
            </>
          ) : (
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files && e.target.files[0]
              if (!f) return
              try {
                toast.info('Uploading image...')
                const data = await uploadToServer(f, url, token)
                const imgUrl = data?.url || data.data
                setImageSrcLocal(imgUrl)
                toast.success('Image uploaded')
              } catch (err) {
                console.error(err)
                toast.error('Image upload failed')
              }
            }} />
          )}
          <input className="ltm_input" placeholder="Alt text" value={imageAltLocal} onChange={e => setImageAltLocal(e.target.value)} />
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
            const f = e.target.files && e.target.files[0]
            if (!f) return
            try {
              toast.info('Uploading image...')
              const data = await uploadToServer(f, url, token)
              const imgUrl = data?.url || data.data
              setImageSrcLocal(imgUrl)
              toast.success('Image uploaded')
            } catch (err) {
              console.error(err)
              toast.error('Image upload failed')
            }
          }} />
        </div>
        {!gridCreated ? (
          <div className="ltm_row" style={{ gap: 8, alignItems: 'center' }}>
            <label>Rows</label>
            <input className="ltm_small_input" type="number" value={rowsNum} onChange={e => { setRowsNum(e.target.value); }} />
            <label>Columns</label>
            <input className="ltm_small_input" type="number" value={colsNum} onChange={e => { setColsNum(e.target.value); }} />
            <button className="ltm_btn ltm_primary" onClick={createGrid}>Create table</button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button className="ltm_btn" onClick={modifyGrid}>Modify</button>
            </div>
            <div className="ltm_table_grid">
              {grid.map((row, ri) => (
                <div key={ri} className="ltm_row" style={{ gap: 8, marginBottom: 6 }}>
                  {row.map((cell, ci) => (
                    <textarea key={ci} className="ltm_input" style={{ minHeight: 50, flex: 1 }} value={cell} onChange={e => updateCell(ri, ci, e.target.value)} placeholder={ri === 0 ? 'Header' : 'Cell text (use (question_XX))'} />
                  ))}
                </div>
              ))}
            </div>
            <button className="ltm_btn ltm_primary" onClick={handleSave}>Save Table Exercise</button>
          </div>
        )}
      </div>
    )
  }

  // MCQ exercise component
  export const MCQExercise = ({ questionStart = 1, questionEnd = 1, title = '', onSave, initial, registerGetPayload, onDirtyChange }) => {
    const n = Math.max(1, Number(questionEnd) - Number(questionStart) + 1)
    const parseKeysFromTitle = (t) => {
      const m = t.match(/\b[A-Z]\b/g)
      if (m && m.length) {
        // trường hợp kiểu: A D
        // hoặc OCR bị mất dấu nối
        if (
          m.length === 2 &&
          m[1].charCodeAt(0) !== m[0].charCodeAt(0) + 1
        ) {
          const start = m[0].charCodeAt(0)
          const end = m[1].charCodeAt(0)

          const result = []

          for (let i = start; i <= end; i++) {
            result.push(String.fromCharCode(i))
          }

          return result
        }

        return m
      }
      if (/True\s*False/i.test(t)) {
        return ['TRUE', 'FALSE', 'NOT GIVEN']
      }

      if (/Yes\s*No/i.test(t)) {
        return ['YES', 'NO', 'NOT GIVEN']
      }

      return ['A', 'B', 'C']
    }

    const [questions, setQuestions] = useState(() => {
      if (initial && Array.isArray(initial.questions)) {
        return initial.questions.map(q => ({ q: Number(q.q), question: q.question || '', options: (q.options || []).map(o => ({ key: o.key, type: o.type || 'text', text: o.text || '', src: o.src || '' })) }))
      }
      const keys = parseKeysFromTitle(title)
      return Array.from({ length: n }, (_, i) => ({ q: Number(questionStart) + i, question: '', options: keys.map(k => ({ key: k, type: 'text', text: '', src: '' })) }))
    })
    const [exerciseImage, setExerciseImage] = useState(initial?.imageBlock?.src || '')
    const [exerciseImageAlt, setExerciseImageAlt] = useState(initial?.imageBlock?.alt || '')
    const { url, token } = useContext(StoreContext)
    const exerciseFileRef = useRef(null)
    const markDirty = () => onDirtyChange && onDirtyChange(true)

    // Recreate / resize questions when title or range changes, preserving by question number when possible
    useEffect(() => {
      const keys = parseKeysFromTitle(title)
      setQuestions(prev => {
        const desiredN = Math.max(1, Number(questionEnd) - Number(questionStart) + 1)
        return Array.from({ length: desiredN }, (_, i) => {
          const qNum = Number(questionStart) + i
          const existing = prev.find(pq => Number(pq.q) === qNum) || {}
          const optionsExisting = existing.options || []
          const newOptions = keys.map(k => {
            const existingOpt = optionsExisting.find(o => o.key === k)
            return existingOpt ? { ...existingOpt, key: k } : { key: k, type: 'text', text: '', src: '' }
          })
          return { q: qNum, question: existing.question || '', options: newOptions }
        })
      })
    }, [title, questionStart, questionEnd])

    const updateQuestionField = (idx, field, value) => setQuestions(prev => { const copy = [...prev]; copy[idx][field] = value; markDirty(); return copy })

    const updateOption = (qi, oi, field, value) => setQuestions(prev => {
      const copy = prev.map(q => ({ ...q, options: q.options ? [...q.options] : [] }))
      copy[qi].options[oi][field] = value
      markDirty()
      return copy
    })

    const isTFType = /True\s*False|Yes\s*No|Not Given/i.test(title)

    const handleSave = () => {
      const payloadQuestions = questions.map(qObj => {
        const opts = isTFType ? qObj.options.map(o => ({ key: o.key })) : qObj.options.map(o => {
          if (o.type === 'image') return { key: o.key, type: 'image', src: o.src }
          return { key: o.key, type: 'text', text: o.text }
        })
        return { q: Number(qObj.q), question: qObj.question, options: opts }
      })
      const block = { type: 'mcq', questions: payloadQuestions }
      const imageBlock = exerciseImage ? { type: 'image', src: exerciseImage, alt: exerciseImageAlt } : null
      onSave(imageBlock ? { block, imageBlock } : block)
      onDirtyChange && onDirtyChange(false)
    }

    useEffect(() => {
      if (!registerGetPayload) return
      const getter = () => {
        const payloadQuestions = questions.map(qObj => {
          const opts = isTFType ? qObj.options.map(o => ({ key: o.key })) : qObj.options.map(o => {
            if (o.type === 'image') return { key: o.key, type: 'image', src: o.src }
            return { key: o.key, type: 'text', text: o.text }
          })
          return { q: Number(qObj.q), question: qObj.question, options: opts }
        })
        const block = { type: 'mcq', questions: payloadQuestions }
        const imageBlock = exerciseImage ? { type: 'image', src: exerciseImage, alt: exerciseImageAlt } : null
        return imageBlock ? { block, imageBlock } : block
      }
      registerGetPayload(getter)
      return () => registerGetPayload(null)
    }, [questions, exerciseImage, exerciseImageAlt, isTFType, registerGetPayload])

    return (
      <div className="ltm_mcq_exercise">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          {exerciseImage ? (
            <>
              <img src={exerciseImage.url} alt={exerciseImageAlt} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              <button className="ltm_btn" onClick={() => fileRef.current?.click()}>Update</button>
              <button className="ltm_btn" onClick={() => { setExerciseImage(''); setExerciseImageAlt(''); markDirty() }}>Remove</button>
            </>
          ) : (
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files && e.target.files[0]
              if (!f) return
              try {
                toast.info('Uploading image...')
                const data = await uploadToServer(f, url, token)
                const imgUrl = data?.url || data.data
                setExerciseImage(imgUrl)
                markDirty()
                toast.success('Image uploaded')
              } catch (err) {
                console.error(err)
                toast.error('Image upload failed')
              }
            }} />
          )}
          <input className="ltm_input" placeholder="Alt text" value={exerciseImageAlt} onChange={e => { setExerciseImageAlt(e.target.value); markDirty() }} />
          <input type="file" ref={exerciseFileRef} style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
            const f = e.target.files && e.target.files[0]
            if (!f) return
            try {
              toast.info('Uploading image...')
              const data = await uploadToServer(f, url, token)
              const imgUrl = data?.url || data.data
              setExerciseImage(imgUrl)
              markDirty()
              toast.success('Image uploaded')
            } catch (err) {
              console.error(err)
              toast.error('Image upload failed')
            }
          }} />
        </div>

        {questions.map((qObj, qi) => (
          <div key={qi} style={{ border: '1px solid #f1f5f9', padding: 8, marginBottom: 8, borderRadius: 6 }}>
            <div style={{ marginBottom: 6 }}><strong>Question {qObj.q}</strong></div>
            <input className="ltm_input" placeholder="Question text" value={qObj.question} onChange={e => updateQuestionField(qi, 'question', e.target.value)} />

            <div style={{ marginTop: 6 }}>
              {!isTFType ? qObj.options.map((op, oi) => (
                <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <div style={{ width: 28 }}>{op.key}.</div>
                  {op.type === 'text' ? (
                    <input className="ltm_input" placeholder={`Option ${op.key}`} value={op.text} onChange={e => updateOption(qi, oi, 'text', e.target.value)} />
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {op.src ? <img src={op.src.url} alt={op.key} style={{ width: 80, height: 60, objectFit: 'cover' }} /> : null}
                      <input id={`mcq_opt_file_${qi}_${oi}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const f = e.target.files && e.target.files[0]
                        if (!f) return
                        try {
                          toast.info('Uploading image...')
                          const data = await uploadToServer(f, url, token)
                          const imgUrl = data?.url || data.data 
                          updateOption(qi, oi, 'src', imgUrl)
                          toast.success('Image uploaded')
                        } catch (err) {
                          console.error(err)
                          toast.error('Image upload failed')
                        }
                      }} />
                      <button className="ltm_btn" onClick={() => document.getElementById(`mcq_opt_file_${qi}_${oi}`)?.click()}>{op.src ? 'Update' : 'Upload'}</button>
                    </div>
                  )}
                  <select className="ltm_select" value={op.type} onChange={e => updateOption(qi, oi, 'type', e.target.value)}>
                    <option value="text">text</option>
                    <option value="image">image</option>
                  </select>
                </div>
              )) : (
                <div style={{ marginTop: 6 }}>
                  <div>Statement only for TF/YN type.</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {qObj.options.map((op, oi) => (
                      <div key={oi} style={{ padding: 6, borderRadius: 6, background: '#fafafa' }}>{op.key}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <button className="ltm_btn ltm_primary" onClick={handleSave}>Save MCQ Exercise</button>
        </div>
      </div>
    )
  }

  // Matching exercise component
  export const MatchingExercise = ({ questionStart = 1, questionEnd = 1, onSave, initial, registerGetPayload, onDirtyChange }) => {
    const n = Math.max(1, Number(questionEnd) - Number(questionStart) + 1)
    const defaultOptionsCount = Math.max(5, n)
    const [options, setOptions] = useState(() => (initial && initial.block && Array.isArray(initial.block.options)) ? initial.block.options.map(o => ({ key: o.key, text: o.text })) : Array.from({ length: defaultOptionsCount }, (_, i) => ({ key: String.fromCharCode(65 + i), text: '' })))
    const [questionsLocal, setQuestionsLocal] = useState(() => (initial && initial.block && Array.isArray(initial.block.questions)) ? initial.block.questions.map(q => ({ q: Number(q.q), label: q.label })) : Array.from({ length: n }, (_, i) => ({ q: Number(questionStart) + i, label: '' })))
    const [exerciseImage, setExerciseImage] = useState(initial?.imageBlock?.src || '')
    const [exerciseImageAlt, setExerciseImageAlt] = useState(initial?.imageBlock?.alt || '')
    const [duplicate, setDuplicate] = useState(Boolean(initial?.block?.duplicate))
    const { url, token } = useContext(StoreContext)
    const exerciseFileRef = useRef(null)
    const markDirty = () => onDirtyChange && onDirtyChange(true)

    useEffect(() => {
      const desiredN = Math.max(1, Number(questionEnd) - Number(questionStart) + 1)
      setQuestionsLocal(prev => Array.from({ length: desiredN }, (_, i) => {
        const qNum = Number(questionStart) + i
        const existing = prev.find(q => Number(q.q) === qNum) || {}
        return { q: qNum, label: existing.label || '' }
      }))
    }, [questionStart, questionEnd])

    const updateOption = (index, field, value) => setOptions(prev => { const copy = prev.map(o => ({ ...o })); copy[index][field] = value; markDirty(); return copy })
    const addOption = () => { setOptions(prev => [...prev, { key: String.fromCharCode(65 + prev.length), text: '' }]); markDirty() }
    const removeOption = (index) => { setOptions(prev => prev.filter((_, i) => i !== index)); markDirty() }

    const updateQuestionLabel = (index, value) => setQuestionsLocal(prev => { const copy = [...prev]; copy[index].label = value; markDirty(); return copy })

    const handleSave = () => {
      const block = { type: 'matching', duplicate: Boolean(duplicate), options: options.map(o => ({ key: o.key, text: o.text })), questions: questionsLocal.map(q => ({ q: Number(q.q), label: q.label })) }
      const imageBlock = exerciseImage ? { type: 'image', src: exerciseImage, alt: exerciseImageAlt } : null
      onSave(imageBlock ? { block, imageBlock } : block)
      onDirtyChange && onDirtyChange(false)
    }

    useEffect(() => {
      if (!registerGetPayload) return
      const getter = () => {
        const block = { type: 'matching', duplicate: Boolean(duplicate), options: options.map(o => ({ key: o.key, text: o.text })), questions: questionsLocal.map(q => ({ q: Number(q.q), label: q.label })) }
        const imageBlock = exerciseImage ? { type: 'image', src: exerciseImage, alt: exerciseImageAlt } : null
        return imageBlock ? { block, imageBlock } : block
      }
      registerGetPayload(getter)
      return () => registerGetPayload(null)
    }, [options, questionsLocal, exerciseImage, exerciseImageAlt, registerGetPayload])

    return (
      <div className="ltm_matching_exercise">
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          {exerciseImage ? (
            <>
              <img src={exerciseImage.url} alt={exerciseImageAlt} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              <button className="ltm_btn" onClick={() => exerciseFileRef.current?.click()}>Update</button>
              <button className="ltm_btn" onClick={() => { setExerciseImage({}); setExerciseImageAlt('') }}>Remove</button>
            </>
          ) : (
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files && e.target.files[0]
              if (!f) return
              try {
                toast.info('Uploading image...')
                const data = await uploadToServer(f, url, token)
                const imgUrl = data?.url || data.data
                setExerciseImage(imgUrl)
                toast.success('Image uploaded')
              } catch (err) {
                console.error(err)
                toast.error('Image upload failed')
              }
            }} />
          )}
            <input className="ltm_input" placeholder="Alt text" value={exerciseImageAlt} onChange={e => { setExerciseImageAlt(e.target.value); markDirty() }} />
          <input type="file" ref={exerciseFileRef} style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
            const f = e.target.files && e.target.files[0]
            if (!f) return
            try {
              toast.info('Uploading image...')
              const data = await uploadToServer(f, url, token)
              const imgUrl = data?.url || data.data
              setExerciseImage(imgUrl)
                markDirty()
              toast.success('Image uploaded')
            } catch (err) {
              console.error(err)
              toast.error('Image upload failed')
            }
          }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ marginRight: 8 }}>Allow duplicate</label>
          <select className="ltm_select" value={duplicate ? 'true' : 'false'} onChange={e => { setDuplicate(e.target.value === 'true'); markDirty() }}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <div>
          <label>Options</label>
          {options.map((opt, i) => (
            <div key={i} className="ltm_row" style={{ gap: 8, marginTop: 6 }}>
              <input className="ltm_small_input" value={opt.key} onChange={e => updateOption(i, 'key', e.target.value)} />
              <input className="ltm_input" value={opt.text} onChange={e => updateOption(i, 'text', e.target.value)} />
              <button className="ltm_btn ltm_secondary" onClick={() => removeOption(i)}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 6 }}><button className="ltm_btn" onClick={addOption}>+ Add option</button></div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Questions</label>
          {questionsLocal.map((q, i) => (
            <div key={i} className="ltm_row" style={{ gap: 8, marginTop: 6 }}>
              <div style={{ width: 80 }}>{q.q}</div>
              <input className="ltm_input" placeholder="label" value={q.label} onChange={e => updateQuestionLabel(i, e.target.value)} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8 }}>
          <button className="ltm_btn ltm_primary" onClick={handleSave}>Save Matching Exercise</button>
        </div>
      </div>
    )
  }