import React, { useState, useEffect } from "react"
import "./MatchGame.css"
import { X, ChevronLeft } from "lucide-react"

const MultipleAnswerGame = ({ words, onClose }) => {

	const [started, setStarted] = useState(false)
	const [count, setCount] = useState(1)
	const [questions, setQuestions] = useState([])
	const [current, setCurrent] = useState(0)
	const [selected, setSelected] = useState(null)
	const [result, setResult] = useState(null)
	const [countdown,setCountdown] = useState(3)


	const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

	const startGame = ()=>{
		setStarted(true)
		let count = 3
		setCountdown(count)
		const cd = setInterval(()=>{
			count--
			if(count===0){
				clearInterval(cd)
				generateQuestions()
			}
			setCountdown(count)
		},1000)
	}

	const generateQuestions = () => {

		let num = Math.min(Number(count), words.length)
		let selectedWords = shuffle(words).slice(0, num)

		let qs = selectedWords.map((w) => {

			const isWordQuestion = Math.random() > 0.5

			let correct = isWordQuestion ? w.definition : w.word

			// lấy 3 đáp án sai
			let wrongPool = words.filter(x => x.word !== w.word)
			wrongPool = shuffle(wrongPool).slice(0, 3)

			let wrongAnswers = wrongPool.map(x =>
				isWordQuestion ? x.definition : x.word
			)

			let options = shuffle([correct, ...wrongAnswers])

			return {
				question: isWordQuestion ? w.word : w.definition,
				options,
				correct,
			}
		})

		setQuestions(qs)
		setStarted(true)
		setCurrent(0)
		setResult(null)
	}

	// chọn đáp án
	const handleAnswer = (opt) => {

		if (selected) return

		setSelected(opt)

		if (opt === questions[current].correct) {
			// đúng
			setTimeout(() => {
				nextQuestion()
			}, 500)
		} else {
			// sai → reset chọn
			setTimeout(() => {
				setSelected(null)
			}, 600)
		}
	}

	const nextQuestion = () => {
		setSelected(null)
		if (current + 1 < questions.length) {
			setCurrent(prev => prev + 1)
		} else {
			setResult("done")
			setStarted(false)
		}
	}

    useEffect(()=>{
        if(result === "done"){
            const t = setTimeout(()=>{
                // reset về màn hình ban đầu
                setStarted(false)
                setQuestions([])
                setCurrent(0)
                setSelected(null)
                setResult(null)
            },2000)

            return ()=>clearTimeout(t)
        }
    },[result])

	return (
		<div className="match_overlay">
			<div className="match_popup">

				<X className="close_match_game" onClick={onClose} />
				<h2>Trắc nghiệm</h2>

				{!started && !result && (
					<>
                    <div className="multiple_game_logo">
                        <div className="multiple_game_logo_size multiple_game_logo_border"></div>
                        <div className="multiple_game_logo_size multiple_game_logo_full"></div>
                        <div className="multiple_game_logo_size multiple_game_logo_full"></div>
                        <div className="multiple_game_logo_size multiple_game_logo_border"></div>
                    </div>
						<div className="mode_select_match_game">
							Số câu:
							<input
								type="number"
								value={count}
								onChange={e => setCount(e.target.value)}
								min="1"
								max={words.length}
								style={{ width: "60px", padding: "4px" }}
							/>
                            (MAX {words.length})
						</div>

						<button
							className="start_match_game_btn"
							onClick={startGame}
						>
							Bắt đầu
						</button>
					</>
				)}

				{started && countdown>0 &&
				<div className="countdown_match_game">
					<h2>
						{countdown}
					</h2>
					<p>
						Chuẩn bị, hãy chọn thẻ từ hoặc định nghĩa tương ứng
					</p>
				</div>
			}	

				{countdown===0 && started&& questions.length > 0 && (
					<>
						<div className="back_match_game"
							onClick={() => {
								setStarted(false)
								setQuestions([])
								setCurrent(0)
								setSelected(null)
							}}
						>
							<ChevronLeft /> Trở về
						</div>

						<div className="timer_match_game">
							{current + 1}/{questions.length}
						</div>

						{/* QUESTION */}
						<div className="game_questions" >
							{questions[current].question}
						</div>

						{/* OPTIONS */}
						<div className="board_match_game multiple_choice_game">

							{questions[current].options.map((opt, i) => {

								const isCorrect = opt === questions[current].correct

								return (
									<div
										key={i}
										className={`card_match_game
											${selected === opt && isCorrect ? "matched_match_game" : ""}
											${selected === opt && !isCorrect ? "wrong_match_game" : ""}
										`}
										onClick={() => handleAnswer(opt)}
									>
										<span>{opt}</span>
									</div>
								)
							})}

						</div>
					</>
				)}

				{result && (
					<div className="countdown_match_game">
						<h2>Hoàn thành</h2>
					</div>
				)}

			</div>
		</div>
	)
}

export default MultipleAnswerGame