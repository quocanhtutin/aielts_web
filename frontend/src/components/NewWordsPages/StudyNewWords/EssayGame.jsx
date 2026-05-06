import React, { useState, useEffect } from "react"
import "./MatchGame.css"
import { X, ChevronLeft, Check } from "lucide-react"

const EssayGame = ({ words, onClose }) => {

	const [started, setStarted] = useState(false)
	const [count, setCount] = useState(1)
	const [mode, setMode] = useState("definition") // definition | example

	const [questions, setQuestions] = useState([])
	const [current, setCurrent] = useState(0)

	const [countdown, setCountdown] = useState(3)
	const [result, setResult] = useState(null)

	const [input, setInput] = useState("")
	const [status, setStatus] = useState(null) // correct | wrong
	const [showAnswer, setShowAnswer] = useState(false)

	const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

	// START GAME + COUNTDOWN
	const startGame = () => {
		setStarted(true)
		let countDown = 3
		setCountdown(countDown)

		const cd = setInterval(() => {
			countDown--
			setCountdown(countDown)

			if (countDown === 0) {
				clearInterval(cd)
				generateQuestions()
			}
		}, 1000)
	}

	// GENERATE QUESTIONS
	const generateQuestions = () => {

		let num = Math.min(Number(count), words.length)
		let selectedWords = shuffle(words).slice(0, num)

		let qs = selectedWords.map((w) => {

			if (mode === "definition") {
				return {
					question: w.definition,
					answer: w.word
				}
			}

			// mode example
			let sentence = w.exampleSentence || ""
			let blank = "_".repeat(w.word.length)

			// replace word (case insensitive)
			let regex = new RegExp(w.word, "i")
			let question = sentence.replace(regex, blank)

			return {
				question,
				answer: w.word
			}
		})

		setQuestions(qs)
		setCurrent(0)
		setResult(null)
		setInput("")
		setStatus(null)
		setShowAnswer(false)
	}

	// CHECK ANSWER
	const handleCheck = () => {

		if (!input.trim()) return

		const correct = questions[current].answer.toLowerCase().trim()
		const user = input.toLowerCase().trim()

		if (correct === user) {
			setStatus("correct")

			setTimeout(() => {
				nextQuestion()
			}, 1000)
		} else {
			setStatus("wrong")
		}
	}

	//NEXT QUESTION
	const nextQuestion = () => {
		setInput("")
		setStatus(null)
		setShowAnswer(false)

		if (current + 1 < questions.length) {
			setCurrent(prev => prev + 1)
		} else {
			setResult("done")
			setStarted(false)
		}
	}

	//RESET AFTER DONE
	useEffect(() => {
		if (result === "done") {
			const t = setTimeout(() => {
				setStarted(false)
				setQuestions([])
				setCurrent(0)
				setInput("")
				setStatus(null)
				setResult(null)
			}, 2000)

			return () => clearTimeout(t)
		}
	}, [result])

	return (
		<div className="match_overlay">
			<div className="match_popup">

				<X className="close_match_game" onClick={onClose} />
				<h2>Tự luận</h2>

				{/* START SCREEN */}
				{!started && !result && (
					<>
						<div className="essay_game_logo">
							<div className="essay_game_logo_size">
                                noun.
                            </div>
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

						{/* MODE */}
						<div className="mode_select_match_game" style={{marginTop: "5vh"}}>
							Chế độ:
							<div className={`mode_match_game ${mode=="definition"?"mode_match_game_active":""}`} onClick={()=>setMode("definition")}>
								Định nghĩa
							</div>
							<div className={`mode_match_game ${mode=="example"?"mode_match_game_active":""}`} onClick={()=>setMode("example")}>
								Ví dụ
							</div>
						</div>

						<button
							className="start_match_game_btn"
							onClick={startGame}
						>
							Bắt đầu
						</button>
					</>
				)}

				{/* COUNTDOWN */}
				{started && countdown > 0 && (
					<div className="countdown_match_game">
						<h2>{countdown}</h2>
						<p>
							{mode === "definition"
								? "Chuẩn bị, hãy điền từ ứng với định nghĩa tương ứng"
								: "Chuẩn bị, hãy điền từ để hoàn thành ví dụ"}
						</p>
					</div>
				)}

				{/* PLAYING */}
				{countdown === 0 && started && questions.length > 0 && (
					<>
						<div className="back_match_game"
							onClick={() => {
								setStarted(false)
								setQuestions([])
								setCurrent(0)
							}}
						>
							<ChevronLeft /> Trở về
						</div>

						<div className="timer_match_game">
							{current + 1}/{questions.length}
						</div>

						{/* QUESTION */}
						<div className="game_questions">
							{questions[current].question}
						</div>

						{/* INPUT */}
						<div className="input_answer_essay_game">
							<input
								value={input}
								onChange={(e) => {
									setInput(e.target.value)
									setStatus(null)
								}}
								autoFocus
							/>

							{status === "correct" && <Check style={{ color: "green" }}/>}
							{status === "wrong" && <X style={{ color: "red" }}/>}
						</div>

						{/* BUTTONS */}
						<div className="buttons_check_answer" >
							<button onClick={handleCheck}>Kiểm tra</button>

							<button onClick={() => setShowAnswer(!showAnswer)}>
								Đáp án
							</button>
						</div>

						{/* ANSWER */}
						{showAnswer && (
							<div className="answer_essay_game" >
								Đáp án: <b>{questions[current].answer}</b>
							</div>
						)}
					</>
				)}

				{/* DONE */}
				{result && (
					<div className="countdown_match_game">
						<h2>Hoàn thành</h2>
					</div>
				)}

			</div>
		</div>
	)
}

export default EssayGame