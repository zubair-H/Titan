import React, { useEffect } from 'react';
import axios from 'axios';
import '../css/ProtectedComponent.css'
import ProtectedNavBar from './ProtectedNavBar';
import { Navigate, useNavigate } from 'react-router-dom';

const ProtectedComponent = () => {
    const navigate = useNavigate()
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                  
                    return;
                }

                const response = await axios.get('https://titan-server-nine.vercel.app/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

            } catch (error) {
              
                localStorage.removeItem('authToken');
                alert('something went wrong...')
                navigate('/login')
                console.error('Error fetching user profile:', error.message);

            }
        };

        fetchUserData();
    }, []);

    return (
        <div className='protectedOuterDiv'>
            <ProtectedNavBar></ProtectedNavBar>
        </div>
    );
};



export default ProtectedComponent;
