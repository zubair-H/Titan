import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/classes.css'
import AddSendTasks from './AddSendTasks'

export default function ClassSchedule() {
    const [data, setData] = useState([]);
    const [currentDate, setCurrentDate] = useState('');
   




    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert("Invalid token");
                    return;
                }

                const response = await axios.get('http://localhost:8001/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    setData(response.data);
                } else {
                    console.error('Invalid data format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error.message);
            }
        };
        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

        setCurrentDate(today);


        fetchUserData();
    }, []);

    const renderClassSchedule = () => {
        const { pdftitle, classInfo, schedule, Assignments } = data.extractedInfo || {}; // Destructure the data or provide default empty objects
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format


        if (!pdftitle || !classInfo || !schedule || !Assignments) {
            return <p>No class schedule or assignments available.</p>;
        }


        // Filter the schedule to include entries for today's date
        const todaySchedule = schedule.filter(info => info.date === today);


        // Filter assignments that have the start date equal to today's date
        const todayAssignments = Assignments.filter(assignment => assignment.startDate === today);



        if (todaySchedule.length === 0 && todayAssignments.length === 0) {
            return <p>No classes or assignments scheduled for today.</p>;
        }

        return (
            <div className='classScheduleCard'>
                {todaySchedule.length > 0 && (
                    <div className='outerStuff'>
                        <h3 className='today'>Today</h3>

                        {todaySchedule.map((info, index) => (
                            <div key={`class-${index}`} className='stuff'>
                                <a className='li'>
                                    <input type="checkbox" className='checkBox'></input> Type: {info.type}:  {classInfo.classTitle} - {classInfo.time} - {classInfo.classLocation}
                                    <button className='Remind'>Remind</button>
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {todayAssignments.length > 0 && (
                    <div>
                        <br />

                        {todayAssignments.map((assignment, index) => (
                            <div key={`assignment-${index}`}>
                                Type Assignment: {assignment.type}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className='outer'>
            <p className='todayTitle2'>Welcome {currentDate}-2024 </p>
            <div>
                {renderClassSchedule()}
            </div>

            <div className='api'>
             
            </div>

        </div>
    );
}
