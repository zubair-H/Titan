import React, { useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';
import Register from './Register';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and register
    const navigate = useNavigate();

    const handleSaveUser = async (event) => {
        event.preventDefault();

        try {
            const userData = { email, password };
            const response = await axios.post('https://titan-server-blush.vercel.app/login', userData);

            const { token } = response.data;
            localStorage.setItem('authToken', token);
            navigate('/protected');
        } catch (error) {
            console.error('Error logging in:', error.message);
            alert('Invalid email or password');
        }
    };

    return (
        <>
            <Navbar />
            <div className='loginDiv'>
                <div className='login-register-container'>
                    <div  className='tab-header'>
                        <h2
                       

                            className={`tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </h2>
                        <h2
                            className={`tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Register
                        </h2>
                    </div>

                    <div className='login-register'>
                        {isLogin ? (
                            <form onSubmit={handleSaveUser} className='innerLogin-register'>
                                <h1 className='login'>LOGIN</h1>
                                <label htmlFor="email" className='email'>Please Enter Your Email & Password</label>
                                <input
                                  
                                    placeholder='Email'
                                    type="email"
                                    id='email'
                                    name='email'
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <br />
                                <input
                                    placeholder='Password'
                                    type="password"
                                    id='password'
                                    name='password'
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <br />
                                <div className='login-button-outer'>
                                    <button type="submit">Login</button>
                                </div>
                            </form>
                        ) : (
                           <Register></Register>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
