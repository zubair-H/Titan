import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function UpComingAssignments() {
    const [data, setData] = useState([]);

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

        fetchUserData();
    }, []);

    const renderUpcomingAssignments = () => {
        const { pdftitle, classInfo, schedule, Assignments } = data.extractedInfo || {}; // Destructure the data or provide default empty objects
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

        if (!pdftitle || !classInfo || !schedule || !Assignments) {
            return <p>No class schedule or assignments available.</p>;
        }

        // Filter assignments that are upcoming
        const upcomingAssignments = Assignments.filter(assignment => {
            const startDate = new Date(assignment.startDate);
            const todayDate = new Date(today);
            return startDate > todayDate;
        });

        if (upcomingAssignments.length === 0) {
            return <p>No upcoming assignments</p>;
        }

        return (
            <div className='assignmentList'>
                {upcomingAssignments.map((assignment, index) => (
                    <a className='liOnGoing'>
                        <input type="checkbox" className='checkBox'></input>
                        Assignment Type: {assignment.type} - Start Date: {assignment.startDate} - Due Date: {assignment.Duedate}  <button className='Remind'>Remind</button>
                    </a>

                ))}
            </div>
        );
    };

    return (
        <div className='outerOnGoing'>
            <p className='todayTitle2'>On Going </p>
            {renderUpcomingAssignments()}
        </div>
    );
}
