import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../css/NewCalendar.css';
import moment from 'moment';
import { Navigate, useNavigate } from 'react-router-dom';

import listPlugin from '@fullcalendar/list';

export default function NewCalendar() {
    const navigate = useNavigate()
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
    const [showRemoveButton, setShowRemoveButton] = useState(true);


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

                const response = await axios.get('https://titan-server-blush.vercel.app/profile', {
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
                            reminderTime: event.reminderTime,
                            backgroundColor: event.eventColor,

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
        e.preventDefault();

        // Validate that the start time is before the end time
        const startDateTime = new Date(`${dateStart}T${startTime}`);
        const endDateTime = new Date(`${dateEnd}T${endTime}`);




        if (startDateTime >= endDateTime) {
            alert("The event start time must be before the end time.");
            return;
        }

        // Validate that the reminder time is in the future
        const reminderDateTime = new Date(reminderTime);
        const currentDateTime = new Date();
        if (reminderTime && reminderDateTime <= currentDateTime) {
            alert("The reminder time must be in the future.");
            return;
        }



        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login')
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

            const response = await axios.post('https://titan-server-blush.vercel.app/add-event', event, {
                headers: { Authorization: `Bearer ${token}` }
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

            if (newEvent.reminderTime) {
                setShowRemoveButton(true);
            } else {
                setShowRemoveButton(false);
            }

            // Reset form and states
            setTitle('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setDateStart('');
            setDateEnd('');
            setReminderTime('');
            setShowForm(false);
            setShowReminderForm(false);
        } catch (error) {
            alert('Unable to create this event, pleae log out and login again.')
            localStorage.removeItem('authToken');
            navigate('/login')
            
            console.error('Error adding event:', error.response ? error.response.data : error.message);
        }
    };


    const handleEventClick = (info) => {
        const { event } = info;

        console.log(event, '+++++++++++++++++++++++++++++++++++++++++++++++++++++++')

        const clickedEvent = {
            id: event.id,
            title: event.title,
            description: event.extendedProps.description,
            start: event.startStr,
            end: event.endStr,
            reminderTime: event.extendedProps.reminderTime || '', // Ensure default value if undefined
            reminderEmail: event.extendedProps.reminderEmail || '' // Ensure default value if undefined
        };

        const isEditable = !hasEventEnded(event.endStr);

        setSelectedEvent(clickedEvent);
        setEditingEvent(isEditable);
        setShowEventDetails(true);
    };


    const handleEventDrop = async (info) => {
        const { event } = info;

        // Gather necessary event details
        const updatedEvent = {
            id: event.id,
            title: event.title,
            description: event.extendedProps.description,
            start: event.startStr,
            end: event.endStr,
            reminderTime: event.extendedProps.reminderTime,
            reminderEmail: event.extendedProps.reminderEmail
        };

        console.log('Updated Event:', updatedEvent);  // Check what data is being sent

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            await axios.put('https://titan-server-blush.vercel.app/update-event', updatedEvent, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Assuming that event updates are reflected in these states
            setEditedEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev))
            );
            setEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev))
            );
        } catch (error) {
            alert('Unable to update this event, plaese log out and login in')
            localStorage.removeItem('authToken');
            navigate('/login')
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

    const handleCloseEventDetails = () => {
        setShowEventDetails(false);
        setSelectedEvent(null);
        setEditingEvent(false);
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
        e.preventDefault();

        // Validate that the start time is before the end time
        const startDateTime = new Date(`${dateStart}T${startTime}`);
        const endDateTime = new Date(`${dateEnd}T${endTime}`);




        if (startDateTime >= endDateTime) {
            alert("The event start date must be greater than or equal to today's date.");
            return;
        }

        // Validate that the reminder time is in the future
        const reminderDateTime = new Date(reminderTime);
        const currentDateTime = new Date();
        if (reminderTime && reminderDateTime <= currentDateTime) {
            alert("The reminder time must be in the future.");
            return;
        }




        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            // Prepare updated event data
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

            console.log(updatedEvent);

            // Make API call to update the event
            await axios.put(`https://titan-server-blush.vercel.app/edit-event/${selectedEvent.id}`, updatedEvent, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update the state with all relevant fields
            const updatedEventFormatted = {
                id: selectedEvent.id,
                title,
                description,
                start: `${dateStart}T${convertTo24Hour(startTime)}`,
                end: `${dateEnd}T${convertTo24Hour(endTime)}`,
                reminderTime: reminderTime || selectedEvent.reminderTime, // Update if reminderTime is set
                reminderEmail: userEmail || selectedEvent.reminderEmail, // Update if userEmail is set
            };

            setEditedEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );
            setEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );

            console.log(updatedEventFormatted, 'Event updated successfully');

            setShowRemoveButton(!!updatedEventFormatted.reminderTime);


            // Clear form and state
            setTitle('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setDateStart('');
            setDateEnd('');
            setReminderTime('');
            setUserEmail(''); // Ensure userEmail is cleared
            setEditingEvent(false);
            setShowForm(false);
            setShowReminderForm(false);
            setSelectedEvent(null);
        } catch (error) {
            alert('Unable to update this event, plaese log out and login in')
            localStorage.removeItem('authToken');
            navigate('/login')
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

            // Ensure that the correct data is being sent to the backend
            await axios.delete('https://titan-server-blush.vercel.app/delete-event', {
                data: { id: selectedEvent },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update the state to remove the deleted event from the UI
            setEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
            setEditedEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
            setSelectedEvent(null);
            setShowEventDetails(false);
        } catch (error) {
            alert('Unable to Delete this event, please retry logging')
            localStorage.removeItem('authToken');
            navigate('/login')
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

    // Helper function to check if the event has ended
    const hasEventEnded = (end) => moment().isAfter(moment(end));

    // Helper function to check if the reminder has been sent
    const hasReminderBeenSent = (reminderTime) => moment(reminderTime).isBefore(moment());

    // Function to customize event content
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const isEventEnded = hasEventEnded(event.end);
        const isReminderSent = hasReminderBeenSent(event.extendedProps.reminderTime);

        return (
            <div style={{
                textDecoration: isEventEnded ? 'line-through' : 'none',
                color: isReminderSent ? 'red' : 'white',
                textAlign: 'left',
                fontSize: '14px',
                padding: '8px',

            }}>
                {event.title}
            </div>
        );
    };


    const handleRemoveReminder = async () => {
        if (!selectedEvent || !selectedEvent.reminderTime) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert("Invalid token");
                return;
            }

            // Send request to remove reminder from the server
            await axios.delete(`https://titan-server-blush.vercel.app/remove-reminder`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    eventID: selectedEvent.id
                }
            });

            // Update state to clear reminder info only
            setEvents(prevEvents =>
                prevEvents.map(ev =>
                    ev.id === selectedEvent.id
                        ? { ...ev, reminderTime: '', reminderEmail: '' }
                        : ev
                )
            );
            setEditedEvents(prevEvents =>
                prevEvents.map(ev =>
                    ev.id === selectedEvent.id
                        ? { ...ev, reminderTime: '', reminderEmail: '' }
                        : ev
                )
            );

            // Hide the remove reminder button
            setShowRemoveButton(false);

            // Clear form and state if needed
            setReminderTime('');
            setUserEmail('');
            setShowForm(false);
        } catch (error) {

            console.error('Error removing reminder:', error.response ? error.response.data : error.message);
        }
    };


    const handleCancel = () => {
        setShowForm(false);          // Close the form
        setShowEventDetails(true);   // Ensure event details view is visible
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
                    eventContent={renderEventContent}


                />
                {showForm && (
                    <div className="form-container">
                        <div className='addEventCancelOuter'>
                            <a className='addEventCancel' type="button" onClick={() => setShowForm(false)}>
                                x
                            </a>
                        </div>
                        <form ref={formRef} className="event-form" onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}>
                            <input
                                required
                                id='addEventTitle'
                                placeholder='Add Title'
                                type="text"
                                value={title}

                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea
                                id='description'
                                required
                                className='addEventTextArea'
                                placeholder='Add Description'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <input
                                placeholder='Reminder Email'
                                type="email"
                                id="userEmail"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                            /> <br />
                            <div className='timeAndDate'>
                                <label>
                                    Date Start:
                                    <input
                                        required
                                        type="date"
                                        value={dateStart}
                                        onChange={(e) => setDateStart(e.target.value)}
                                    />
                                </label>
                                <label>
                                    Date End
                                    <input

                                        required
                                        type="date"
                                        value={dateEnd}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Start Time
                                    <input
                                        id="reminderTime"

                                        required
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </label> <br />
                                <label>
                                    End Time
                                    <input
                                        id="reminderTime"
                                        required
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </label> <br />
                                <div className="reminder-form">


                                    <label htmlFor="reminderTime">Reminder Time:</label>
                                    <input
                                        type="datetime-local"
                                        id="reminderTime"
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                    />
                                </div>
                                {editingEvent && selectedEvent.reminderTime && (
                                    <div className="reminder-info">
                                        <p>Reminder Email: {selectedEvent.reminderEmail}</p>
                                        <p>Reminder Time: {moment(selectedEvent.reminderTime).format('YYYY-MM-DD h:mm A')}</p>
                                    </div>
                                )}
                            </div>
                            <button type="submit">
                                {editingEvent ? 'Update Event' : 'Add Event'}
                            </button>
                            {editingEvent && <button type="button" onClick={handleCancel}>Cancel</button>}
                        </form>

                    </div>
                )}

                {showEventDetails && (
                    <div className="event-details" ref={eventDetailsRef}>
                        <a type='button' className='closeForm' onClick={handleCloseEventDetails} >x</a>
                        <div>
                            <h2 style={{ textDecoration: hasEventEnded(selectedEvent.end) ? 'line-through' : 'none' }}>
                                {selectedEvent.title}
                            </h2>
                            <p className='description'>{selectedEvent.description}</p>

                            <p>Start: {moment(selectedEvent.start).format('YYYY-MM-DD h:mm A')}</p>
                            <p>End: {moment(selectedEvent.end).format('YYYY-MM-DD h:mm A')}</p>

                            <button className='editButton' onClick={handleDeleteEvent}>Delete</button>

                            {!hasEventEnded(selectedEvent.end) && (
                                <button className='editButton' onClick={handleEditClick}>Edit</button>
                            )}

                            {selectedEvent.reminderTime && (
                                <>

                                    {moment(selectedEvent.reminderTime).isBefore(moment()) && (
                                        <p style={{ color: 'red' }}>Event has already been reminded</p>
                                    )}
                                    {showRemoveButton && (
                                        <div>
                                            <p>Reminder: {moment(selectedEvent.reminderTime).format('YYYY-MM-DD h:mm A')}</p>
                                            <button onClick={handleRemoveReminder}>Remove Reminder</button>
                                        </div>

                                    )}


                                </>
                            )}



                        </div>
                    </div>
                )}



            </div>

        </>
    );
}