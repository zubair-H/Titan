import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../css/NewCalendar.css';
import moment from 'moment';

export default function NewCalendar() {
    const [events, setEvents] = useState([]);
    const [editedEvents, setEditedEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(false);
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    const formRef = useRef(null);
    const eventDetailsRef = useRef(null);
    const convertTo24Hour = (timeStr) => {
        return moment(timeStr, 'h:mm A').format('HH:mm');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:8001/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    const userData = response.data;

                    const eventsArray = Object.values(userData.events).map(event => {
                        const startDate = event.dateStart;
                        const endDate = event.dateEnd;
                        const startTime = convertTo24Hour(event.startTime);
                        const endTime = convertTo24Hour(event.endTime);

                        return {
                            id: event.uniqueID,
                            title: event.eventName,
                            description: event.description,
                            start: `${startDate}T${startTime}`,
                            end: `${endDate}T${endTime}`,
                            reminderTime: event.reminderTime
                        };
                    });

                    setEvents(eventsArray);
                    setEditedEvents(eventsArray);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleAddEvent = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            const event = {
                title,
                description,
                startTime,
                endTime,
                dateStart,
                dateEnd,
                reminderTime,
                reminderEmail: userEmail
            };

            const response = await axios.post('http://localhost:8001/add-event', event, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const newEvent = response.data;

            const newEventFormatted = {
                id: newEvent.uniqueID,
                title: newEvent.eventName,
                description: newEvent.description,
                start: `${newEvent.dateStart}T${convertTo24Hour(newEvent.startTime)}`,
                end: `${newEvent.dateEnd}T${convertTo24Hour(newEvent.endTime)}`,
                reminderTime: newEvent.reminderTime,
                reminderEmail: newEvent.reminderEmail
            };

            setEditedEvents(prevEvents => [...prevEvents, newEventFormatted]);
            setEvents(prevEvents => [...prevEvents, newEventFormatted]);









            handleCloseForm();
        } catch (error) {
            console.error('Error adding event:', error.response ? error.response.data : error.message);
        }
    };

    const handleEventClick = (info) => {
        const { event } = info;

        const clickedEvent = {
            id: event.id,
            title: event.title,
            description: event.extendedProps.description,
            start: event.startStr,
            end: event.endStr,
            reminderTime: event.extendedProps.reminderTime || '',
            reminderEmail: event.extendedProps.reminderEmail || ''
        };

        const isEditable = !hasEventEnded(event.endStr);

       
        setSelectedEvent(clickedEvent);
        setEditingEvent(isEditable);
        setShowEventDetails(true);
    };

    const handleEventDrop = async (info) => {
        const { event } = info;
        const updatedEvent = {
            id: event.id,
            start: event.startStr,
            end: event.endStr
        };

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            await axios.put('http://localhost:8001/update-event', updatedEvent, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setEditedEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev))
            );
            setEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev))
            );
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const handleDateClick = (info) => {
        // Reset all states to ensure a clean slate
        setSelectedEvent(null); // Clear selected event
        setEditingEvent(false); // Disable editing
        setShowEventDetails(false); // Hide event details

        // Set new event's start and end dates
        setDateStart(info.startStr);
        setDateEnd(info.endStr || info.startStr);
        setShowForm(true); // Show the form to add a new event
    };

    const handleCloseForm = () => {
        setShowForm(false); // Hide the form
        // Clear all form fields
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setDateStart('');
        setDateEnd('');
        setReminderTime('');
        setShowReminderForm(false);
    };

    const handleCloseEventDetails = () => {
        setShowEventDetails(false); // Hide event details
        setSelectedEvent(null); // Clear selected event
        setEditingEvent(false); // Disable editing
    };

    const handleEditClick = () => {
        if (selectedEvent && !hasEventEnded(selectedEvent.end)) {
            // Set form values to the selected event details
            setTitle(selectedEvent.title);
            setDescription(selectedEvent.description);
            setStartTime(moment(selectedEvent.start).format('h:mm A'));
            setEndTime(moment(selectedEvent.end).format('h:mm A'));
            setDateStart(moment(selectedEvent.start).format('YYYY-MM-DD'));
            setDateEnd(moment(selectedEvent.end).format('YYYY-MM-DD'));
            setShowEventDetails(false); // Hide event details
            setShowForm(true); // Show form for editing
            setEditingEvent(true); // Enable editing
        } else {
            alert('Cannot edit an event that has already ended.'); // Alert if event has ended
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            const updatedEvent = {
                id: selectedEvent.id,
                title,
                description,
                startTime: convertTo24Hour(startTime),
                endTime: convertTo24Hour(endTime),
                dateStart,
                dateEnd,
                reminderTime,
                reminderEmail: userEmail,
            };

            const response = await axios.put(`https://titan-server-nine.vercel.app/edit-event/${selectedEvent.id}`, updatedEvent, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const updatedEventFormatted = {
                id: selectedEvent.id,
                title,
                description,
                start: `${dateStart}T${convertTo24Hour(startTime)}`,
                end: `${dateEnd}T${convertTo24Hour(endTime)}`,
                reminderTime,
                reminderEmail: userEmail,
            };

            setEditedEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );
            setEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );

            handleCloseForm();
        } catch (error) {
            console.error('Error updating event:', error.response ? error.response.data : error.message);
        }
    };

    const handleDeleteEvent = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            await axios.delete('http://localhost:8001/delete-event', {
                data: { id: selectedEvent.id },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
            setEditedEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
            setSelectedEvent(null);
            setShowEventDetails(false);
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    useEffect(() => {
        const overlay = document.getElementById('overlay');
        if (showForm || showEventDetails) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }, [showForm, showEventDetails]);

    const hasEventEnded = (eventEndTime) => {
        return moment(eventEndTime).isBefore(moment());
    };

    return (
        <>
            <div className='newCalendarOuter'>
                <div id="overlay" className='overlay'></div>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView='dayGridMonth'
                    views={{
                        dayGridMonth: { buttonText: 'Month' },
                        timeGridWeek: { buttonText: 'Week' },
                        timeGridDay: { buttonText: 'Day' }
                    }}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    editable
                    selectable
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    eventDrop={handleEventDrop}
                    height={795}
                />

                {showForm && (
                    <div className="form-container">
                        <form ref={formRef} onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}>
                            <h2>{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
                            <label>
                                Title:
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Description:
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </label>
                            <label>
                                Start Time:
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                End Time:
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Start Date:
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                End Date:
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    required
                                />
                            </label>
                            {showReminderForm && (
                                <div className="reminder-form">
                                    <label>
                                        Reminder Time:
                                        <input
                                            type="time"
                                            value={reminderTime}
                                            onChange={(e) => setReminderTime(e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Your Email:
                                        <input
                                            type="email"
                                            value={userEmail}
                                            readOnly
                                        />
                                    </label>
                                </div>
                            )}
                            <button type="submit">{editingEvent ? 'Update Event' : 'Add Event'}</button>
                            <button type="button" onClick={handleCloseForm}>Close</button>
                        </form>
                    </div>
                )}

                {showEventDetails && (
                    <div className="event-details" ref={eventDetailsRef}>
                        <h2>{selectedEvent.title}</h2>
                        <p>{selectedEvent.description}</p>
                        <p>Start: {moment(selectedEvent.start).format('MMMM D, YYYY h:mm A')}</p>
                        <p>End: {moment(selectedEvent.end).format('MMMM D, YYYY h:mm A')}</p>
                        <button onClick={handleEditClick}>Edit</button>
                        <button onClick={handleDeleteEvent}>Delete</button>
                        <button onClick={handleCloseEventDetails}>Close</button>
                    </div>
                )}
            </div>
        </>
    );
}
