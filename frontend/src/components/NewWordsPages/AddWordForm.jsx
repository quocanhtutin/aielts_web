import React, { useEffect, useState, useContext } from "react"
import "./AddWordForm.css"
import AutoResizeTextarea from '../AutoResizeTextarea/AutoResizeTextarea';
import { StoreContext } from "../../context/StoreContext";
import { X } from "lucide-react";

const wordTypes = [
	"noun",
	"verb",
	"adjective",
	"adverb",
	"preposition",
	"phrasal verb",
	"idiom",
	"collocation",
	"expression",
	"determiner",
	"pronoun",
	"prefix",
	"suffix"
]

const AddWordForm = ({selectedWord, onSaveWord, onClosePopup}) => {

	const [showType, setShowType] = useState(false)
	const {topicWithWord} = useContext(StoreContext)
	const [collection, setCollection] = useState("")

	const [formData, setFormData] = useState({
		word: selectedWord?.word || "",
		type: selectedWord?.type || "",
		pronunciation: selectedWord?.pronunciation || "",
		definition: selectedWord?.definition || "",
		exampleSentence: selectedWord?.exampleSentence || "",
		synonym: selectedWord?.synonym?.join?.(", ") || "",
		opposite: selectedWord?.opposite?.join?.(", ") || "",
		description: selectedWord?.description || ""
	})

	const handleChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	useEffect(() => {
		setFormData({
			word: selectedWord?.word || "",
			type: selectedWord?.type || "",
			pronunciation: selectedWord?.pronunciation || "",
			definition: selectedWord?.definition || "",
			exampleSentence: selectedWord?.exampleSentence || "",
			synonym: selectedWord?.synonym?.join?.(", ") || "",
			opposite: selectedWord?.opposite?.join?.(", ") || "",
			description: selectedWord?.description || ""
		})

		setCollection(topicWithWord.find(t => t._id==selectedWord.topicId)?.topic)
	}, [selectedWord])

	const saveWord = () => {

		const formattedWord = {
			...selectedWord, // giữ lại _id nếu edit
			...formData, //sẽ copy đè lên các field trùng với selectedWord 
			synonym: formData.synonym
				? formData.synonym.split(",").map(s => s.trim())
				: [],
			opposite: formData.opposite
				? formData.opposite.split(",").map(s => s.trim())
				: [],
			topicId: selectedWord.topicId 
		}

		// nếu chưa có _id → tạo mới
		if (!formattedWord._id) {
			formattedWord._id = Date.now().toString()
		}

		onSaveWord(formattedWord)
	}

	return (
		<div className="vocab-form">
			<X className="close_popup_add_word_btn" onClick={onClosePopup}/>
			<div className="vocab_form_header">
				<h2 className="vocab-form__title">
					{selectedWord._id ? "Edit Word" : "Add New Word"}
				</h2>
				<h2 className="vocab-form__title">
					{collection? `in ${collection}` : ""}
				</h2>
			</div>
			
			<div className="vocab-form__grid">
				<div className="vocab-form__field">
					<label className="vocab-form__label">
						Word
					</label>

					<input
						className="vocab-form__input"
						value={formData.word}
						onChange={(e)=>handleChange("word",e.target.value)}
						placeholder="Enter word"
					/>
				</div>
				<div className="vocab-form__field">
					<label className="vocab-form__label">
						Type
					</label>

					<div className="vocab-form__dropdown">

						<div
							className="vocab-form__dropdown-btn"
							onClick={()=>setShowType(!showType)}
						>
							{formData.type || "Choose type"}
						</div>

						{showType && (

							<div className="vocab-form__dropdown-menu">

								{wordTypes.map((t,i)=>(
									<div
										key={i}
										className="vocab-form__dropdown-item"
										onClick={()=>{
											handleChange("type",t)
											setShowType(false)
										}}
									>
										{t}
									</div>
								))}

							</div>

						)}

					</div>

				</div>

				{/* Pronunciation */}
				<div className="vocab-form__field">

					<label className="vocab-form__label">
						Pronunciation
					</label>

					<input
						className="vocab-form__input"
						value={formData.pronunciation}
						onChange={(e)=>handleChange("pronunciation",e.target.value)}
						placeholder="/example/"
					/>

				</div>

				{/* Definition */}
				<div className="vocab-form__field vocab-form__field--full">

					<label className="vocab-form__label">
						Definition
					</label>
					<AutoResizeTextarea
						value={formData.definition}
						onChange={(e)=>handleChange("definition",e.target.value)}
					/>

				</div>

				{/* Example */}
				<div className="vocab-form__field vocab-form__field--full">

					<label className="vocab-form__label">
						Example Sentence
					</label>
					<AutoResizeTextarea
						value={formData.exampleSentence}
						onChange={(e)=>handleChange("exampleSentence",e.target.value)}
					/>

				</div>

				{/* Synonym */}
				<div className="vocab-form__field">

					<label className="vocab-form__label">
						Synonym
					</label>

					<input
						className="vocab-form__input"
						value={formData.synonym}
						onChange={(e)=>handleChange("synonym",e.target.value)}
						placeholder="word1, word2"
					/>

				</div>

				{/* Opposite */}
				<div className="vocab-form__field">

					<label className="vocab-form__label">
						Opposite
					</label>

					<input
						className="vocab-form__input"
						value={formData.opposite}
						onChange={(e)=>handleChange("opposite",e.target.value)}
						placeholder="word1, word2"
					/>

				</div>

				{/* Description */}
				<div className="vocab-form__field vocab-form__field--full">

					<label className="vocab-form__label">
						Description
					</label>
					<AutoResizeTextarea
						value={formData.description}
						onChange={(e)=>handleChange("description",e.target.value)}
					/>

				</div>

			</div>

			<button className="vocab-form__submit" onClick={saveWord}>
				Save Word
			</button>

		</div>
	)
}

export default AddWordForm