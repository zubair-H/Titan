import React, { useEffect } from 'react'
import '../css/section1.css'
import image from '../assets/ai.webp'
import { Navigate, useNavigate } from 'react-router-dom';


export default function Section1() {  
    const navigate = useNavigate()
    const move = (async (e) => {

        try {

            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login')
            }
            else {
                navigate('/protected')
            }



        } catch (error) {


        }
    })

    return (
        <div className='section1'>
            <div className='outerOuterTitle'>
                <div className='titleOuter'>
                    <h1 style={{color:'white'}} className='section1Title'>Unlock Your Potential </h1>

                    <h1 style={{color:'white'}} className='something'>
                        Rise Above, With<span className='titan-highlight'>  Titan</span>
                        <p className='tradeMark'>Powered by OpenAi API</p>
                    </h1>
                    <button className='btn' onClick={move}>Check It Out</button>
                </div>
            </div>
            <div className='imageOuter'>
                <img src={image} alt="" className='img' />

            </div>

        </div>
    )
}
