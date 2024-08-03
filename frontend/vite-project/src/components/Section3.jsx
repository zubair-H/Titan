import React from 'react';
import '../css/section3.css';
import picture from '../assets/25.png';
import picture2 from '../assets/26.png';
import { useNavigate } from 'react-router-dom'; // Ensure you are importing from 'react-router-dom'

export default function Section3() {
  const navigate = useNavigate(); // Call the useNavigate function here

  const handleRegButton = () => {
    navigate('/login');
    console.log('this button is working');
  }

  return (
    <div className='section3'>
      <div className='section3-title1'>
        <h2>However, As Once Steve Jobs said, "There's One More Thing..."</h2>
      </div>
      <div className='section3-title2'>
        <h3>Meet <span>TITAN-GUIDE</span></h3>
      </div>
      <div className='tradeMark'>
        <p>Powered By Open AI API</p>
      </div>
      <div className='section3-row'>
        <div className='section3-content'>
          <p>Titan Guide enhances your study experience using OpenAI technology. Transform study materials into interactive note cards by entering your topic, pasting your guide, and selecting the number of questions. Effortlessly edit or delete these personalized cards for a tailored study session with precision and ease.</p>
          <div className='button-outer'>
            <button onClick={handleRegButton} className='section3-button'>Try It Now</button>
          </div>
        </div>
        <div className='section3-img-outer'>
          <img className='section3-img' src={picture} alt="" />
          <img className='section3-img' src={picture2} alt="" />
        </div>
        <br />
      </div>
    </div>
  );
}
