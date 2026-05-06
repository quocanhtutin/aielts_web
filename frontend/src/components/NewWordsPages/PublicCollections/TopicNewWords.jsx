import React, {useState} from 'react'
import './PublicNewWordCollections.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TopicNewWords = ({words}) => {

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const nextCard = () => {
		if(index < words.length - 1){
			setIndex(index + 1)
			setFlipped(false)
		}
	}

	const prevCard = () => {
		if(index > 0){
			setIndex(index - 1)
			setFlipped(false)
		}
	}

	const word = words[index]

  return (
    <div className="pub_flashcard-container">

			<ChevronLeft
				className="pub_flashcard-arrow pub_flashcard-arrow-left"
				onClick={prevCard}
			/>

			<div 
				className={`pub_flashcard ${flipped ? "is-flipped" : ""}`}
				onClick={()=>setFlipped(!flipped)}
			>

				<div className="pub_flashcard-inner">

					<div className="pub_flashcard-front">

						<div className='pub_flashcard_word'>{word.word}</div>
						<p className="type">{word.type}</p>
						<p className="pron">{word.pronunciation}</p>

					</div>

					<div className="pub_flashcard-back">
						<p className='pub_flashcard_def'>{word.definition}</p>
					</div>

				</div>

			</div>

			<ChevronRight
				className="pub_flashcard-arrow pub_flashcard-arrow-right"
				onClick={nextCard}
			/>

		</div>
  )
}

export default TopicNewWords
