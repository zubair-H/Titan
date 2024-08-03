
import Navbar from './Navbar'
import '../css/register.css'

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [name, setName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSaveUser = (event) => {
        event.preventDefault();

        const userData = {
            name,
            userName,
            email,
            password
        };

        console.log('Sending user data:', userData);

        axios.post('http://localhost:8001/register', userData)
            .then(() => {
                alert('Account has been Created Successfully!')
                navigate('/protected');
            })
            .catch(error => {
                if (error.response && error.response.data && error.response.data.message) {
                    alert(`Registration Error: ${error.response.data.message}`);
                } else {
                    alert('An error occurred during registration.');
                }
                console.error('Error registering user:', error);
            });
    };


    return (
        <>
            <div className='registerDiv'>
                <h1 className='registerTitle'>Register</h1>
                <div className='registerForm'>
                    <form onSubmit={handleSaveUser}>

                        <input
                            type='text'
                            id='name'
                            name='name'
                            placeholder='Name'
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        /><br />
                        <input
                            type='text'
                            id='userName'
                            name='userName'
                            placeholder='Username'
                            required
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        /><br />
                        <input
                            type="email"
                            id='email'
                            name='email'
                            required
                            placeholder='Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        /><br />

                        <input
                            type="password"
                            id='password'
                            name='password'
                            required
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        /><br />

                        <div className='button-outer'>
                            <button type="submit">Register</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
