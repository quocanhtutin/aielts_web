import React,{useState,useEffect} from "react"
import "./MatchGame.css"
import { X, ChevronLeft } from "lucide-react"

const MatchGame = ({words,onClose}) => {

	const [mode,setMode] = useState("easy_match_game")
	const [started,setStarted] = useState(false)
	const [countdown,setCountdown] = useState(3)
	const [cards,setCards] = useState([])
	const [selected,setSelected] = useState([])
	const [time,setTime] = useState(0)
	const [timer,setTimer] = useState(null)

	const [result,setResult] = useState(null)

	const recordEasy = localStorage.getItem("match_easy")
	const recordHard = localStorage.getItem("match_hard")

	const startGame = ()=>{
		setStarted(true)
		let count = 3
		setCountdown(count)
		const cd = setInterval(()=>{
			count--
			if(count===0){
				clearInterval(cd)
				initBoard()
			}
			setCountdown(count)
		},1000)
	}
	
	useEffect(()=>{
		setResult(null)
	}, [mode])

	const initBoard = ()=>{

		let size = mode==="easy_match_game"?6:10
		let selectedWords = words.slice(0,size)
		let board = []
		selectedWords.forEach((w,i)=>{
			board.push({
				id:"w"+i,
				type:"word",
				text:w.word,
				pair:i
			})

			board.push({
				id:"d"+i,
				type:"definition",
				text:w.definition,
				pair:i
			})
		})
		board.sort(()=>Math.random()-0.5)
		setCards(board)
		setTime(0)
		const t = setInterval(()=>{
			setTime(prev=> +(prev + 0.01).toFixed(2))
		},10)
		setTimer(t)
	}

	const handleSelect = (card,index)=>{
        if(selected.length===2) return
        if(selected.find(s=>s.index===index)) return
        const newSelected = [...selected,{card,index}]
        setSelected(newSelected)

        if(newSelected.length===2){
            const [a,b] = newSelected
            if(a.card.pair===b.card.pair){
                setCards(prev =>
                    prev.map((c,i)=>{
                        if(i===a.index || i===b.index){
                            return {...c,status:"matched"}
                        }
                        return c
                    })
                )

                setTimeout(()=>{
                    setCards(prev =>
                        prev.map(c =>
                            c.status==="matched"
                                ? {...c, hidden:true}
                                : c
                        )
                    )
                    setSelected([])
                },600)
            }else{
                setCards(prev =>
                    prev.map((c,i)=>{

                        if(i===a.index || i===b.index){
                            return {...c,status:"wrong"}
                        }
                        return c
                    })
                )
                setTimeout(()=>{
                    setCards(prev =>
                        prev.map(c=>({...c,status:null}))
                    )
                    setSelected([])
                },600)
            }
        }
    }

	useEffect(()=>{
		if(cards.length > 0){
			const allHidden = cards.every(c => c.hidden)
			if(allHidden){

				clearInterval(timer)

				const key = mode==="easy_match_game"?"match_easy":"match_hard"
				const record = localStorage.getItem(key)

				if(!record || time < record){
					localStorage.setItem(key,time)
				}

				setResult(time)

				// reset game 
				setTimeout(()=>{
					setStarted(false)
					setCards([])
					setTime(0)
					setSelected([])
				},800)

			}
		}

	},[cards])

	return(
	<div className="match_overlay">
		<div className="match_popup">
            <X className="close_match_game" onClick={()=>onClose()}/>
            <h2>Ghép thẻ</h2>
            
				
			{mode && !started &&
				<>
                    <div className="match_game_logo_card_under"></div>
                    <div className="match_game_logo_card_above"></div>  
                    <div className="mode_select_match_game">
                        Độ khó:
                        <div className={`mode_match_game ${mode=="easy_match_game"?"mode_match_game_active":""}`} onClick={()=>setMode("easy_match_game")}>
                            Dễ (12)
                        </div>
                        <div className={`mode_match_game ${mode=="hard_match_game"?"mode_match_game_active":""}`} onClick={()=>setMode("hard_match_game")}>
                            Khó (20)
                        </div>
                    </div>

					{result && (
						<p className="result_match_game">
							Kết quả: {result.toFixed(2)} s
						</p>
					)}
					<button className="start_match_game_btn" onClick={startGame}>
						Bắt đầu
					</button>
				</>
			}

			{started && countdown>0 &&
				<div className="countdown_match_game">
					<h2>
						{countdown}
					</h2>
					<p>
						Chuẩn bị, hãy chọn từ và định nghĩa tương ứng
					</p>
				</div>
			}

			{countdown===0 && cards.length>0 &&
				<>
					<div className="back_match_game"
						onClick={()=>{
							clearInterval(timer)
							setStarted(false)
							setCards([])
							setTime(0)
							setSelected([])
							setResult(null)
						}}
					> 
						<ChevronLeft /> Trở về	
					</div>
					<div className="timer_match_game">
						{time.toFixed(2)} <p>s</p>
					</div>
					<div className={`board_match_game ${mode}`}>

                        {cards.map((c,i)=>{

                            const isSelected = selected.find(s=>s.index===i)

                            return(

                                <div
                                    key={i}
                                    className={`card_match_game 
                                        ${isSelected?"selected_match_game":""}
                                        ${c.status==="matched"?"matched_match_game":""}
                                        ${c.status==="wrong"?"wrong_match_game":""}
                                    `}
                                    onClick={()=>!c.hidden && handleSelect(c,i)}
                                    style={{
                                        visibility: c.hidden ? "hidden" : "visible"
                                    }}
                                >
                                    <span>{c.text}</span>
                                </div>

                            )

                        })}

                    </div>
				</>
			}

		</div>

	</div>

	)

}

export default MatchGame