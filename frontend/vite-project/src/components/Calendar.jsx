import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../css/calendar.css';
import moment from 'moment';
import AddSendTasks from './AddSendTasks';
import AddEvent from './AddEvent';

export default function ClassSchedule() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [addEvent, setAddEvent] = useState(false);
    const [clickedDate, setClickedDate] = useState(null);
    const [editForm, setEditForm] = useState(false);
    const [showDuration, setShowDuration] = useState(true);

    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const cardRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert("Invalid token");
                    return;
                }

                const response = await axios.get('https://titan-server-nine.vercel.app/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    const extractedInfo = response.data.extractedInfo;
                    const formattedEvents = [];

                    Object.keys(extractedInfo).forEach(key => {
                        const classData = extractedInfo[key];

                        // Schedule events (Lectures and Recitations)
                        classData.schedule.forEach(schedule => {
                            let startTime, endTime, description;

                            if (schedule.type === 'Lecture') {
                                startTime = `${schedule.date}T${convertTo24Hour(classData.lectureTimes.startTime)}`;
                                endTime = `${schedule.date}T${convertTo24Hour(classData.lectureTimes.endTime)}`;
                                description = classData.lectureDescription || 'No description available'; // Add description
                            } else if (schedule.type === 'Recitation') {
                                startTime = `${schedule.date}T${convertTo24Hour(classData.recitationTimes.startTime)}`;
                                endTime = `${schedule.date}T${convertTo24Hour(classData.recitationTimes.endTime)}`;
                                description = classData.recitationDescription || 'No description available'; // Add description
                            }

                            if (startTime && endTime) {
                                formattedEvents.push({
                                    title: `[${classData.className}] ${schedule.type}`,
                                    uniqueID: schedule.uniqueId,
                                    start: startTime,
                                    end: endTime,
                                    color: classData.classColor,
                                    description: description, // Add description
                                    extendedProps: {
                                        classInfo: classData.classInfo,
                                        uniqueID: schedule.uniqueId
                                    }
                                });
                            }
                        });

                        // Assignments
                        classData.assignments.forEach(assignment => {
                            formattedEvents.push({
                                title: `[${classData.className}] ${assignment.type}: ${assignment.title}`,
                                start: assignment.startDate,
                                end: assignment.dueDate,
                                color: classData.assignmentColor,
                                description: assignment.description || 'No description available', // Add description
                                extendedProps: {
                                    uniqueID: assignment.uniqueId
                                }
                            });
                        });
                    });

                    setEvents(formattedEvents);
                } else {
                    console.error('Invalid data format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error.message);
            }
        };

        fetchUserData();
    }, []);

    const convertTo24Hour = (timeStr) => {
        return moment(timeStr, 'h:mm A').format('HH:mm');
    };

    const addTask = () => {
        setShowAddTask(prevState => !prevState);
    };

    const showEditForm = () => {
        setEditForm(prevState => !prevState);
    };

    const showDurationOption = () => {
        setShowDuration(prevState => !prevState);
    };

    const handleEditAndSubmit = (eventOrSubmit, isSubmit = false) => {
        if (isSubmit) {
            eventOrSubmit.preventDefault();

            const payload = {
                type,
                title,
                startDate,
                endDate,
                isAllDay,
                startTime: isAllDay ? null : startTime,
                endTime: isAllDay ? null : endTime,
                uniqueID: selectedEvent.extendedProps.uniqueID
            };

            axios.post('https://titan-server-nine.vercel.app/edit-event', payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            })
                .then(() => {
                    setEditForm(false);
                    // Optionally, refetch events or update state
                })
                .catch(error => {
                    console.error('Error updating event:', error.message);
                });

        } else {
            const uniqueID = eventOrSubmit.extendedProps.uniqueID;
            console.log('Clicked event uniqueID:', uniqueID);

            showEditForm();

            axios.post('https://titan-server-nine.vercel.app/edit-event', { uniqueID }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            })
                .then(response => {
                    const eventData = response.data;
                    setType(eventData.type);
                    setTitle(eventData.title);
                    setStartDate(eventData.startDate);
                    setEndDate(eventData.endDate);
                    setIsAllDay(eventData.isAllDay);
                    setStartTime(eventData.startTime);
                    setEndTime(eventData.endTime);
                })
                .catch(error => {
                    console.error('Error editing event:', error.message);
                });
        }
    };

    const handleCheckboxChange = () => {
        setIsAllDay(!isAllDay);
    };

    return (
        <div className='outer'>
            <div className='calendar-container'>
                <FullCalendar
                    height={770}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth" // Default view set to Month
                    events={events}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay' // Added week and day views
                    }}
                    eventClick={(info) => {
                        setSelectedEvent(info.event);
                    }}
                />
            </div>
            {addEvent && (
                <div className='eventsOuter'>
                    <AddEvent clickedDate={clickedDate} />
                </div>
            )}

            {selectedEvent && (
                <div className='outerCard' ref={cardRef}>
                    <h3 className='outerCardTitle'>{selectedEvent.title}</h3>
                    <h1 className='outerCardTitle'>{selectedEvent.description || "No Description"}</h1>
                    <p className='outerCardP' style={{ fontSize: '13px' }}>
                        <div>
                            <button onClick={() => handleEditAndSubmit(selectedEvent)}>Edit</button>
                            <button onClick={addTask}>Remind Me</button>
                            {showAddTask ? <AddSendTasks /> : ""}
                        </div>
                        Start {moment(selectedEvent.start).format('MMMM D, YYYY h:mm A')}
                    </p>
                    <p className='outerCardP' style={{ fontSize: '13px' }}>
                        End {moment(selectedEvent.end).format('MMMM D, YYYY h:mm A')}
                    </p>
                    {selectedEvent.extendedProps.classInfo && (
                        <>
                            <p style={{ fontSize: '13px' }}>Class Info:</p>
                            <p style={{ fontSize: '13px' }}>Title: {selectedEvent.extendedProps.classInfo.classTitle}</p>
                        </>
                    )}

                    {editForm && (
                        <div>
                            <h3>Edit Event</h3>
                            <form onSubmit={(e) => handleEditAndSubmit(e, true)}>
                                <label htmlFor="type">Type:</label>
                                <input
                                    type="text"
                                    id="type"
                                    name="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                />
                                <br />
                                <label htmlFor="title">Title:</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <br />
                                <label htmlFor="startDate">Start Date:</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <br />
                                <label htmlFor="endDate">End Date:</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                                <br />
                                <label htmlFor="isAllDay">All Day:</label>
                                <input
                                    type="checkbox"
                                    id="isAllDay"
                                    name="isAllDay"
                                    checked={isAllDay}
                                    onChange={handleCheckboxChange}
                                />
                                <br />
                                {!isAllDay && (
                                    <>
                                        <label htmlFor="startTime">Start Time:</label>
                                        <input
                                            type="time"
                                            id="startTime"
                                            name="startTime"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                        <br />
                                        <label htmlFor="endTime">End Time:</label>
                                        <input
                                            type="time"
                                            id="endTime"
                                            name="endTime"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                        />
                                        <br />
                                    </>
                                )}
                                <button type="submit">Submit</button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
