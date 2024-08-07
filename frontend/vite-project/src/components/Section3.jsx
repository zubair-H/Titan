import React from 'react';
import '../css/section3.css';
import picture from '../assets/25.png';



export default function Section3() {


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

          <p>Titan Guide revolutionizes your study sessions with OpenAI technology. Simply input your topic, paste your guide, and choose your questions to create interactive note cards</p>


        </div>
        <div className='section3-img-outer'>
          <img className='section3-img' src={picture} alt="" />
        </div>
      </div>
    </div>
  );
}
