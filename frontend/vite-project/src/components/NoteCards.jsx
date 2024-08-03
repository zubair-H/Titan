import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/NoteCards.css';

export default function NoteCards() {
    const [noteCards, setNoteCards] = useState([]);
    const [expandedCard, setExpandedCard] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState({ q1: '', a1: '' });
    const [showAddNote, setShowAddNoteCard] = useState(false);

    useEffect(() => {
        fetchNoteCards();
    }, []);

    const fetchNoteCards = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('https://titan-server-blush.vercel.app/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const noteCardsArray = Object.values(response.data.noteCard).map(noteCard => ({
                uniqueID: noteCard.noteCardUnique,
                title: noteCard.noteCardTitle,
                questions: noteCard.noteCardInfo.map(info => ({
                    q1: info.q1,
                    a1: info.a1,
                    _id: info._id
                }))
            }));

            setNoteCards(noteCardsArray);
        } catch (error) {
            console.error('Error fetching noteCards:', error.message);
        }
    };

    const handleCardClick = (noteCard) => {
        setExpandedCard(expandedCard === noteCard ? null : noteCard);
        setCurrentQuestionIndex(0);
        setShowAnswer(false);
    };

    const handleQuestionClick = () => {
        setShowAnswer(prev => !prev);
    };

    const handleDeleteNoteCard = async (uniqueID) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`https://titan-server-blush.vercel.app/delete-noteCard?uniqueID=${uniqueID}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setNoteCards(prevNoteCards => prevNoteCards.filter(card => card.uniqueID !== uniqueID));

            if (expandedCard && expandedCard.uniqueID === uniqueID) {
                setExpandedCard(null);
                setCurrentQuestionIndex(0);
                setShowAnswer(false);
            }
        } catch (error) {
            console.error('Error deleting note card:', error.message);
        }
    };

    const handleNextQuestion = () => {
        if (expandedCard && currentQuestionIndex < expandedCard.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowAnswer(false);
        }
    };

    const handlePreviousQuestion = () => {
        if (expandedCard && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowAnswer(false);
        }
    };

    const handleDeleteQuestion = async (noteCardUnique, questionId) => {
        try {
            const token = localStorage.getItem('authToken');

            await axios.delete(`https://titan-server-blush.vercel.app/delete-noteCard-question?noteCardUnique=${noteCardUnique}&questionId=${questionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setExpandedCard(prevCard => {
                if (prevCard && prevCard.uniqueID === noteCardUnique) {
                    const updatedQuestions = prevCard.questions.filter(question => question._id !== questionId);

                    let newQuestionIndex = currentQuestionIndex;
                    if (newQuestionIndex >= updatedQuestions.length) {
                        newQuestionIndex = updatedQuestions.length - 1;
                    }

                    setCurrentQuestionIndex(newQuestionIndex);

                    return {
                        ...prevCard,
                        questions: updatedQuestions
                    };
                }
                return prevCard;
            });

            setNoteCards(prevNoteCards => prevNoteCards.map(card => {
                if (card.uniqueID === noteCardUnique) {
                    const updatedQuestions = card.questions.filter(question => question._id !== questionId);
                    return {
                        ...card,
                        questions: updatedQuestions
                    };
                }
                return card;
            }));

        } catch (error) {
            console.error('Error deleting question:', error.message);
        }
    };

    const handleEditClick = (question) => {
        setIsEditing(true);
        setEditedQuestion({ q1: question.q1, a1: question.a1, _id: question._id });
    };

    const handleSaveEdit = async () => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(`https://titan-server-blush.vercel.app/edit-noteCard-question`, {
                noteCardUnique: expandedCard.uniqueID,
                questionId: editedQuestion._id,
                q1: editedQuestion.q1,
                a1: editedQuestion.a1
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setExpandedCard(prevCard => {
                if (prevCard && prevCard.uniqueID === expandedCard.uniqueID) {
                    const updatedQuestions = prevCard.questions.map(question =>
                        question._id === editedQuestion._id
                            ? { ...question, q1: editedQuestion.q1, a1: editedQuestion.a1 }
                            : question
                    );

                    return { ...prevCard, questions: updatedQuestions };
                }
                return prevCard;
            });

            setNoteCards(prevNoteCards => prevNoteCards.map(card =>
                card.uniqueID === expandedCard.uniqueID
                    ? {
                        ...card, questions: card.questions.map(question =>
                            question._id === editedQuestion._id
                                ? { ...question, q1: editedQuestion.q1, a1: editedQuestion.a1 }
                                : question
                        )
                    }
                    : card
            ));

            setIsEditing(false);

        } catch (error) {
            console.error('Error editing question:', error.message);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const navigate = useNavigate();
    const addNoteCards = () => {
        window.location.href = '/protected';
    };

    return (
        <div className='outerMost'>
            <p className='titleCards'>Note Cards</p>

            {noteCards.length === 0 ? (
                <div className='no-cards-div'>
                    <p className='no-cards-message'>Note Cards are not available.</p> <br />
                    <div className='no-note-card-btn-outer'>
                        <button onClick={addNoteCards} className='no-cards-button'>+ Note Cards</button>
                    </div>
                </div>
            ) : (
                <div className="note-cards-container">
                    <div className='note-card-outer'>
                        {noteCards.map(noteCard => (
                            <div
                                key={noteCard.uniqueID}
                                className={`note-card ${expandedCard === noteCard ? 'active' : ''}`}
                                onClick={() => handleCardClick(noteCard)}
                            >
                                <div className='editBtnsOuter'>
                                    <button className='editBtns' style={{ backgroundClip: 'blu' }} onClick={() => handleDeleteNoteCard(noteCard.uniqueID)}>&#9746;</button>
                                </div>
                                <p>{noteCard.title}</p>
                            </div>
                        ))}
                        <span className='addNoteCardActive' onClick={addNoteCards}>+</span>
                    </div>
                </div>
            )}

            {expandedCard && expandedCard.questions.length > 0 && (
                <div className="questions-container">
                    <div className="slideshow-container">
                        <div className="question-card">
                            {isEditing ? (
                                <div className={`editing ${isEditing ? 'show' : ''}`}>
                                    <input
                                        type="text"
                                        value={editedQuestion.q1}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, q1: e.target.value }))}
                                    />
                                    <textarea className='editinTextArea'
                                        type="text"
                                        value={editedQuestion.a1}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, a1: e.target.value }))}
                                    />
                                    <button className='saveBtn' onClick={handleSaveEdit}>Save</button>
                                    <button onClick={handleCancelEdit}>Cancel</button>
                                </div>
                            ) : (
                                <div>
                                    <div className='btnForNoteCards'>
                                        <span className='editBtns3' onClick={() => handleDeleteQuestion(expandedCard.uniqueID, expandedCard.questions[currentQuestionIndex]._id)}>
                                            &#9746;
                                        </span>
                                        <span className='editBtns2' onClick={() => handleEditClick(expandedCard.questions[currentQuestionIndex])}>Edit</span>
                                    </div>
                                    <p>
                                        <strong>Question:</strong> {expandedCard.questions[currentQuestionIndex].q1}
                                    </p>
                                    <button className="show-answer-btn" onClick={handleQuestionClick}>
                                        {showAnswer ? 'Hide Answer' : 'Show Answer'}
                                    </button>
                                    <div className={`answer-container ${showAnswer ? 'show' : 'hide'}`}>
                                        <p><strong>Answer:</strong> {expandedCard.questions[currentQuestionIndex].a1}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="navigation-buttons">
                            <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
                            <button onClick={handleNextQuestion} disabled={currentQuestionIndex === expandedCard.questions.length - 1}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
