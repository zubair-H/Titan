import React, { useEffect, useState, useRef } from 'react';
import '../css/Titan.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Titan() {
  const [title, setTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAdditionalInput, setShowAdditionalInput] = useState(false);
  const [additionalInput, setAdditionalInput] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const additionalInputRef = useRef(null);

  const TITLE_WORD_LIMIT = 100;
  const STUDY_GUIDE_WORD_LIMIT = 16445;
  const NUMBER_OF_CARDS_LIMIT = 60;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
        }

        await axios.get('https://titan-server-blush.vercel.app/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error fetching user profile:', error.message);
      }
    };

    fetchUserData();
  }, [navigate]);

  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const titleWordCount = countWords(title);
    const studyGuideWordCount = countWords(additionalInput);

    if (titleWordCount > TITLE_WORD_LIMIT || titleWordCount < 1) {
      alert(`Title exceeds the word limit of ${TITLE_WORD_LIMIT} words.`);
      setLoading(false);
      return;
    }

    if (studyGuideWordCount > STUDY_GUIDE_WORD_LIMIT || studyGuideWordCount < 1) {
      alert(`Study guide exceeds the word limit of ${STUDY_GUIDE_WORD_LIMIT} words.`);
      setLoading(false);
      return;
    }

    if (numberOfQuestions > NUMBER_OF_CARDS_LIMIT || numberOfQuestions < 1) {
      alert(`Number of Note cards is exceeding ${NUMBER_OF_CARDS_LIMIT} note cards.`);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://titan-server-blush.vercel.app/upload', {
        title,
        studyGuide: additionalInput,
        numberOfQuestions
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });


      alert('YOUR NOTE CARDS ARE READY, NAVIGATE TO THE NOTE CARDS TAB')
      setSuccessMessage(response.data.message);
      setShowButton(true);
      setTitle("");
      setAdditionalInput("");
      setNumberOfQuestions(1);
      setShowAdditionalInput(false);


    } catch (error) {
      navigate('/login')
      alert('Something Went Wrong')
      console.error('Error uploading data:', error.message);
      setError('Error uploading data');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setShowAdditionalInput(true);
  };

  const handleBlur = (event) => {
    if (
      (inputRef.current && !inputRef.current.contains(event.relatedTarget)) &&
      (additionalInputRef.current && !additionalInputRef.current.contains(event.relatedTarget))
    ) {
      setTimeout(() => {
        setShowAdditionalInput(false);
      }, 300);
    }
  };

  return (
    <div className='titan-outer'>
      {loading && <div id="overlay" className="loading-overlay active">
        <div className="loading-indicator"></div>
      </div>}

      <div className='titan-title'>
        <h2>Titan-Guide</h2>
      </div>
      <div className='outerForm'>
        <div
          className={`titan-input-outer`}
          onBlur={handleBlur}
          tabIndex="0"
        >
          <div className='form'>
            <form onSubmit={handleSubmit}>
              <div className='input-group' ref={inputRef}>
                <input
                  className={`titan-input ${showAdditionalInput ? 'expanded' : ''}`}
                  required
                  type="text"
                  placeholder='Note Card Title...'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <input
                  className={`titan-input2 ${showAdditionalInput ? 'expanded2' : ''}`}
                  required
                  type="number"
                  placeholder="Note Cards qty"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button type='submit' className='submit'>Submit</button>
              </div>
              <div className={`additional-input-container ${showAdditionalInput ? 'expanded' : ''}`} ref={additionalInputRef}>
                <div className="additional-input-overlay"></div>
                <textarea
                  required
                  className='additional-input'
                  placeholder='Enter Study Guide...'
                  value={additionalInput}
                  onChange={(e) => setAdditionalInput(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
      {showSuccess && (
        <div className='success-message'>
          <p>{successMessage}</p>
          {showButton && <button onClick={() => console.log('Note cards shown')}>Show Note Cards</button>}
        </div>
      )}
      {error && <div className='error-message'>{error}</div>}
    </div>
  );
}
