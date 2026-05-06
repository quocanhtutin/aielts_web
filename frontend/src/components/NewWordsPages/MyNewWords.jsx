import React, { useState, useEffect, useRef, useContext } from 'react'
import './NewWordsComponent.css'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext';
import TaskBoard from './TaskBoard';
import AddWordForm from './AddWordForm';
import { toast } from 'react-toastify';
import axios from 'axios';

export const BOARD_LABEL_COLORS = [
    "#4BCE97", "#E2B203", "#FAA53D", "#F87462", "#9F8FEF", "#579DFF",
    "#60C6D2", "#94C748", "#E774BB", "#8590A2", "#B3DF3B", "#F5CD47",
    "#FEA362", "#F87168", "#76BB86", "#6CC3E0", "#E1B309", "#172B4D",
    "#0052CC", "#C1C7D0"
];

const MyNewWords = () => {

    const { boardId } = useParams();
    const { token, topicWithWord, setTopicWithWord, url } = useContext(StoreContext);
    const [boardData, setBoardData] = useState(null);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardDes, setBoardDes] = useState("");
    
    const descTextareaRef = useRef(null);

    const [showCardDetailPopup, setShowCardDetailPopup] = useState(false)
    const [cardDetail, setCardDetail] = useState({})

    const [columns, setColumns] = useState([])

    const [selectedWord, setSelectedWord] = useState({})

    const [rawColor, setRawColor] = useState("#0079bf")


    const updateCardInColumn = (columnId, cardId, field, value) => {
        setColumns(prev => prev.map(col => col.id === columnId ? {
            ...col, cards: col.cards.map(card => card.id === cardId ? { ...card, [field]: value } : card)
        } : col));
    }

    const handleOpenMoveList = (listId) => {
        setSelectedListToMove(listId);
        setShowMoveListPopup(true);
    }

    const handleSoftDeleteCard = async (cardToDelete) => {
        setShowCardDetailPopup(false);

        const originalColumns = [...columns];
        const colIndex = columns.findIndex(c => c.id === cardToDelete.columnId);
        if (colIndex === -1) return;

        const newColumns = [...columns];
        newColumns[colIndex].cards = newColumns[colIndex].cards.filter(c => c.id !== cardToDelete.id);
        setColumns(newColumns);

        try {
            await cardService.delete(cardToDelete.id);
        } catch (error) {
            console.error("Lỗi xóa card:", error);
            setColumns(originalColumns);
            alert("Có lỗi xảy ra khi xóa thẻ!");
            return;
        }
    };

    const handleUpdateCardStatus = async (cardId, currentCheckState) => {
        const newCheckState = !currentCheckState;
        const statusInt = newCheckState ? 2 : 1;

        let foundColumnId = null;
        for (const col of columns) {
            if (col.cards.find(c => c.id === cardId)) {
                foundColumnId = col.id;
                break;
            }
        }
        
        if (!foundColumnId) return;

        updateCardInColumn(foundColumnId, cardId, "check", newCheckState);
        
        if (showCardDetailPopup && cardDetail.id === cardId) {
            setCardDetail(prev => ({ ...prev, check: newCheckState }));
        }

        try {
            await cardService.updateStatus(cardId, statusInt);
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            alert("Không thể cập nhật trạng thái thẻ!");
            updateCardInColumn(foundColumnId, cardId, "check", currentCheckState);
             if (showCardDetailPopup && cardDetail.id === cardId) {
                setCardDetail(prev => ({ ...prev, check: currentCheckState }));
            }
        }
    };


    const storeColumn = async (columnIndex) => {
        const columnToArchive = columns[columnIndex];
        const listId = columnToArchive.id;

        try {
            await listService.archive(listId);
            // Fetch lại để đồng bộ hoặc update state
            const now = new Date().toLocaleString("vi-VN");
            const newColumns = [...columns];
            newColumns.splice(columnIndex, 1);
            setColumns(newColumns);

        } catch (error) {
            console.error("Lỗi lưu trữ danh sách:", error);
            alert("Không thể lưu trữ danh sách!");
        }
    }

    const addNewList = async (listTitle) => {
        if (!listTitle.trim()) return;
        try {
            const response = await axios.post(`${url}/api/flashcard/topic`,{
                topic: listTitle
            },{
                headers: { Authorization: `Bearer ${token}` },
            })
            if(response.data.success){
                const newTopic = response.data.data
                setTopicWithWord([...topicWithWord,{...newTopic, words:[]}])
            }
        } catch (error) { 
            console.error(error); 
            toast.error("Lỗi tạo bộ sưu tập!")
        }
    }

    const handleMoveList = async (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, movedColumn);
        setColumns(newColumns);
        try { await listService.updatePosition(movedColumn.id, toIndex); } catch (e) { console.error(e); }
    }

    const handleSaveWord = (newWord) => {
        try{
            setTopicWithWord(prev =>
                prev.map(topic => {
                    if (topic._id !== newWord.topicId) return topic

                    const existed = topic.words.find(w => w._id === newWord._id)

                    // UPDATE
                    if (existed) {
                        return {
                            ...topic,
                            words: topic.words.map(w =>
                                w._id === newWord._id ? newWord : w
                            )
                        }
                    }

                    // ADD NEW
                    return {
                        ...topic,
                        words: [...topic.words, newWord]
                    }
                })
            )

            toast.success("Cập nhật từ thành công!")
        }
        catch(e){
            toast.error("Cập nhật từ thất bại!")
        }
        
    }

    const handleDeleteWord = (word) => {
        toast(
            ({ closeToast }) => (
            <div style={{ textAlign: "center", fontSize:"14px" }}>
                <p>Bạn có chắc muốn xóa từ {word.word} không?</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                    className="btn_toast toast_yes"
                    onClick={() => {
                    console.log("YES")
                    closeToast()
                    }}
                >
                    Yes
                </button>

                <button
                    className="btn_toast toast_no"
                    onClick={closeToast}>
                    No
                </button>
                </div>
            </div>
            ),
            {
            position: "top-center",
            autoClose: false,
            closeOnClick: false,
            draggable: false
            }
        )
    }

    return (
        <div className="man-table-container">

            <div className={`main-content wide-board`}>
                <AddWordForm 
                    selectedWord={selectedWord} 
                    onSaveWord={handleSaveWord}
                />

                <TaskBoard
                    setShowCardDetailPopup={setShowCardDetailPopup}
                    setCardDetail={setCardDetail}
                    addNewList={addNewList}
                    rawColor={rawColor}
                    onSoftDelete={handleSoftDeleteCard}
                    storeColumn={storeColumn}
                    boardTitle={boardTitle}
                    boardLabelColors={BOARD_LABEL_COLORS}
                    handleDragEnd={handleMoveList}
                    onMoveList={handleOpenMoveList}
                    onToggleStatus={handleUpdateCardStatus}
                    setSelectedWord={setSelectedWord}
                />
            </div>
        </div>
    )
}

export default MyNewWords
