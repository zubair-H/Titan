import React, { useEffect, useState } from 'react';
import '../css/ProtectedSection.css';
import axios from 'axios';
import ClassSchedule from './ClassSchedule'
import OnGoingAssignments from './OnGoingAssignments'
import UpComingAssignments from './UpComingAssignments';
import ProtectedNavBar from './ProtectedNavBar';

export default function ProtectedSection() {
    const [extractedInfo, setExtractedInfo] = useState([]);
    const [show, setShow] = useState();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert("Invalid token");
                    return;
                }

                const response = await axios.get('https://titan-server-blush.vercel.app/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.extractedInfo) {
                    setExtractedInfo(response.data.extractedInfo);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error.message);
            }
        };

        fetchUserData();
    }, []);




    return (
        <>
           
            <div className='outer'>

                <div className='firstHalf'>
                    <div className='googleCalender'>

                        <h1>Google Calendar (Weekly)</h1>

                    </div>
                    <div className='today'>
                        <h1>Today's todo </h1>
                        <ClassSchedule></ClassSchedule>
                    </div>
                </div>
                <div className='secondHalf'>
                    <div className='onGoing'>
                        <h1>On Going assignments</h1>
                        <OnGoingAssignments></OnGoingAssignments>

                    </div>
                    <div className='upcoming'>
                        <h1>Upcoming Assignments</h1>
                        <UpComingAssignments></UpComingAssignments>
                    </div>
                </div>
                <div><h1>
                    classes</h1></div>
                <div className='class'>
                </div>
            </div>
        </>
        /*
        1. check attedance
        2. prof email/office hours/ its location
        3. late tokens/extra credit
        4. curve yes or no
        */
    );
}
