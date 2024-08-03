import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/addTasks.css';

export default function AddSendTasks() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [email, setEmail] = useState('');
    const [showScheduler, setShowScheduler] = useState(false);
    const [time, setTime] = useState('');
    const [period, setPeriod] = useState('AM');
    const [hasScheduled, setHasScheduled] = useState(false);
    const [tasks, setTasks] = useState([]);

    const sendEmail = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const requestData = {
                to: email,
                subject: subject,
                body: body,
                time: time,
                period: period
            };

            await axios.post('http://localhost:8001/send-email', requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            alert(requestData.time);
            if (time === "") {
                alert('Email scheduled successfully');
            } else {
                alert('Email sent successfully');
            }
            setSubject('');
            setBody('');
            setEmail('');
            setTime('');
            setPeriod('AM');
            setShowScheduler(false); // Hide scheduler after submit
            setHasScheduled(false);
            fetchTasks(); // Refresh the tasks list after scheduling an email
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send email. Please try again later.');
        }
    };

    const handleScheduleSubmit = () => {
        setHasScheduled(true);
        sendEmail();
    };

    const fetchTasks = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.get('http://localhost:8001/get-tasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTasks(response.data.tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    useEffect(() => {
        fetchTasks(); // Fetch tasks when component mounts
    }, []);

    return (
        <div className='divAddTask'>
            <div className='taskPart1'>
                <h3 className='reminderTitle'>Create Reminders</h3>
                <button className='emailSend' onClick={sendEmail}>Send Now</button>
                OR
                <button className='emailSchedule' onClick={() => setShowScheduler(!showScheduler)}>


                    {showScheduler ? 'Hide Scheduler' : 'Schedule'}
                </button>
                <input
                    className='emailRecp'
                    type="email"
                    placeholder="Recipient's Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />


                {!showScheduler && (
                    <div className={`emailInner ${showScheduler ? 'hideInputs' : ''}`}>

                        <input
                            id='emailSubject'
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                        <textarea
                            id='emailMessage'
                            placeholder="Message"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                        />
                    </div>

                )}


                {showScheduler && (
                    <div className='scheduleDiv'>
                        <input
                            type="text"
                            placeholder="Type time: 00:00"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                        <button onClick={handleScheduleSubmit}>Submit</button>
                    </div>
                )}
            </div>
        </div>
    );
}
