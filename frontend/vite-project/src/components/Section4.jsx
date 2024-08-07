import React from 'react';
import '../css/section4.css';
import img from '../assets/30.png';
import { useNavigate } from 'react-router-dom';

export default function Section4() {
    const navigate = useNavigate();

    const handleRegButton = () => {
        navigate('/login');
    };

    return (
        <div className='section4'>
            <div className='section4-text'>
                <h1>Customize Your Note Cards for a Flawlessly Tailored Study Experience</h1>
                <p>Discover the perfect way to refine your study sessions with bespoke note cards, crafted to enhance your learning journey.</p>

                <div  className='button-outer'>
                    <button onClick={handleRegButton} className='section3-button'>Try It Now</button>
                </div>

            </div>


            <div className='section4-img'>
                <img src={img} alt="Study notes" />
            </div>

        </div>

    );
}
