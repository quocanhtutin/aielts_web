import React, { useEffect, useState, useContext } from "react"
import "./FlashCards.css"
import { BookType, BookX, BookMarked, ChevronLeft, ChevronRight, Volume2 } from "lucide-react"
import MatchGame from "./MatchGame.jsx"
import MultipleAnswerGame from "./MultipleAnswerGame.jsx"
import EssayGame from "./EssayGame.jsx"
import { useParams, useNavigate } from "react-router-dom"
import { StoreContext } from "../../../context/StoreContext.jsx"

const FlashCards = () => {

    const { collectionID } = useParams();
    const { topicWithWord, memorizeWord } = useContext(StoreContext)

	const [index, setIndex] = useState(0)
	const [flipped, setFlipped] = useState(false)
    const [showMatchGame,setShowMatchGame] = useState(false)
    const [showMultipleAnswerGame, setShowMultipleAnswerGame] = useState(false)
    const [showEssayGame, setShowEssayGame] = useState(false)
    const [currentTopic, setCurrentTopic] = useState({})

    const navigate = useNavigate()

    useEffect(()=>{
        console.log(topicWithWord);
        if(topicWithWord.length > 0){
            const found = topicWithWord.find(t => t._id == collectionID)
            console.log(found);
            
            setCurrentTopic(found)
        }
    }, [topicWithWord, collectionID])

    const words = currentTopic?.words || []

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

    const percent = words.length ? ((index + 1) / words.length) * 100 : 0

    const memorizedWords = words.filter(w => w.memorized).length 
    const processingWords = words.length - memorizedWords

    const speakWord = (text) => {
        if (!text) return

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "en-US"
        utterance.rate = 0.9
        utterance.pitch = 1

        window.speechSynthesis.cancel() // tránh bị chồng tiếng
        window.speechSynthesis.speak(utterance)
    }

    

    if (!currentTopic || words.length === 0) {
		return <div className="flashcard_page">Loading...</div>
	}

	return (
        <div className="flashcard_page">
            <div className="flashcard_page_header">
                <div className="flashcard_page_header_left">
                    <h2>Collection: {currentTopic.topic} </h2>
                </div>
                <div className="flashcard_page_header_center">
                    <div className="progress-row">
                        <div className="progress-bar">
                            <div 
                                className="progress-bar-percent" 
                                style={{ 
                                    width: `${percent}%`,
                                    backgroundColor: percent === 100 ? '#61bd4f' : '#5ba4cf',
                                    transition: 'width 0.2s ease-in'
                                }} 
                            />
                        </div>
                        <span style={{fontSize: '11px', color: '#5e6c84', minWidth: '35px'}}>{index+1}/{words.length}</span>
                        
                    </div>
                </div>
                <div className="flashcard_page_header_right">
                    <div className="back_to_your_collections_btn_fr_fc" onClick={() => navigate('/user/mynewwordsboard')}>Your Collections</div>
                </div>
            </div>
            <div className="flashcard_page_study">
                <div className="collection_detail">
                    <div className="collection_memorized">Đã thuộc: {memorizedWords} <div className="star_btn">★</div></div>
                    <div className="collection_learning">Đang học: {processingWords} <div className="star_btn">☆</div></div>
                </div>
                <div className="flashcard-container">
                    <ChevronLeft 
                        className="flashcard-arrow flashcard-arrow-left"
                        onClick={prevCard}
                    />
                    <div 
                        className={`flashcard ${flipped ? "is-flipped" : ""}`}
                        onClick={()=>setFlipped(!flipped)}
                    >
                        <div className="flashcard-inner">
                            <div className="flashcard-front">
                                <Volume2 
                                    className="volume_icon"
                                    onClick={(e) => {
                                        e.stopPropagation() // tránh flip card
                                        speakWord(word.word)
                                    }}
                                />
                                <h2>{word.word}</h2>
                                <p className="type">{word.type}</p>
                                <p className="pron">{word.pronunciation}</p>
                                <div className="hint">
                                    Click to flip
                                </div>
                            </div>
                            <div className="flashcard-back">
                                <h3>Definition</h3>
                                <p>{word.definition}</p>
                                <h3>Example</h3>
                                <p>{word.exampleSentence}</p>
                            </div>
                        </div>
                    </div>
                    <ChevronRight 
                        className="flashcard-arrow flashcard-arrow-right"
                        onClick={nextCard}
                    />
                </div>
                <div className="flashcard_detail">
                    <div className="flashcard_memorized" onClick={()=>memorizeWord(word)}>Đã thuộc <div className="star_btn">{word.memorized?"★":"☆"}</div></div>
                    Đồng nghĩa
                    <div className="flashcard_synonym">
                        <BookType /> 
                        <div className="flashcard_detail_content">{word.synonym.join(`, `)}</div>
                    </div>
                    Trái nghĩa
                    <div className="flashcard_opposite">
                        <BookX />
                        <div className="flashcard_detail_content">{word.opposite.join(`, `)}</div>
                    </div>
                    Mô tả
                    <div className="flashcard_description">
                        <BookMarked />
                        <div className="flashcard_detail_content" >{word.description}</div>
                    </div>
                </div>
            </div>
            <div className="flashcard_page_games">
                <h2 className="game_title">Chế độ luyện tập:</h2>
                <div className="game_modes">
                    <div 
                        className="game_card"
                        onClick={()=>setShowMultipleAnswerGame(true)}
                    >
                        <h3>Trắc nghiệm</h3>
                    </div>
                    <div 
                        className="game_card"
                        onClick={()=>setShowEssayGame(true)}
                    >
                        <h3>Tự luận</h3>
                    </div>
                    <div 
                        className="game_card"
                        onClick={()=>setShowMatchGame(true)}
                    >
                        <h3>Ghép thẻ</h3>
                    </div>
                </div>
            </div>

            {showMatchGame && 
                <MatchGame 
                    words={words}
                    onClose={()=>setShowMatchGame(false)}
                />
            }

            {showMultipleAnswerGame &&
                <MultipleAnswerGame 
                    words={words}
                    onClose={()=>setShowMultipleAnswerGame(false)}
                />
            }

            {showEssayGame&&
                <EssayGame 
                    words={words}
                    onClose={()=>setShowEssayGame(false)}
                />
            }
        </div>
	)
}

export default FlashCards