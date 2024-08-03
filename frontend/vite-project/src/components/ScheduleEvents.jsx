import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import '../css/NewCalendar.css'
import moment from 'moment';
import listPlugin from '@fullcalendar/list';


export default function ScheduleEvents() {
    const [events, setEvents] = useState([]);
    const [editedEvents, setEditedEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(false);
    const [showAddSendTasks, setShowAddSendTasks] = useState(false);




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
                    navigate('/login')
                    return;
                }

                const response = await axios.get('https://titan-server-blush.vercel.app/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    const eventsArray = Object.values(response.data.events).map(event => {
                        const startDate = event.dateStart;
                        const endDate = event.dateEnd;
                        const startTime = convertTo24Hour(event.startTime);
                        const endTime = convertTo24Hour(event.endTime);

                        return {
                            id: event.uniqueID,
                            title: event.eventName,
                            description: event.description,
                            start: `${startDate}T${startTime}`,
                            end: `${endDate}T${endTime}`
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


    const handleAddEvent = async () => {
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
                allDay
            };

            const response = await axios.post('https://titan-server-blush.vercel.app/add-event', event, {
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
                end: `${newEvent.dateEnd}T${convertTo24Hour(newEvent.endTime)}`
            };

            setEditedEvents(prevEvents => [...prevEvents, newEventFormatted]);
            setEvents(prevEvents => [...prevEvents, newEventFormatted]);

            setTitle('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setDateStart('');
            setDateEnd('');
            setAllDay(false);
            setShowForm(false);
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
            end: event.endStr
        };

        setSelectedEvent(clickedEvent);
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

            await axios.put('https://titan-server-blush.vercel.app/update-event', updatedEvent, {
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
        setDateStart(info.startStr);
        setDateEnd(info.endStr || info.startStr);
        setShowForm(true);
    };

    const handleCloseEventDetails = () => {
        setShowEventDetails(false);
        setSelectedEvent(null);
        setEditingEvent(false);
        setShowAddSendTasks(false); // Hide AddSendTasks when closing event details
    };

    const handleEditClick = () => {
        if (selectedEvent) {
            setTitle(selectedEvent.title);
            setDescription(selectedEvent.description);
            setStartTime(moment(selectedEvent.start).format('h:mm A'));
            setEndTime(moment(selectedEvent.end).format('h:mm A'));
            setDateStart(moment(selectedEvent.start).format('YYYY-MM-DD'));
            setDateEnd(moment(selectedEvent.end).format('YYYY-MM-DD'));
            setShowEventDetails(false);
            setShowForm(true);
            setEditingEvent(true);
        }
    };

    const handleUpdateEvent = async () => {
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
                startTime: moment(startTime, 'h:mm A').format('HH:mm'), // Convert to 24-hour format
                endTime: moment(endTime, 'h:mm A').format('HH:mm'), // Convert to 24-hour format
                dateStart,
                dateEnd,
                allDay
            };

            const response = await axios.put('https://titan-server-blush.vercel.app/edit-event', updatedEvent, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const updatedEventFormatted = {
                id: selectedEvent.id,
                title,
                description,
                start: `${dateStart}T${convertTo24Hour(startTime)}`,
                end: `${dateEnd}T${convertTo24Hour(endTime)}`
            };

            setEditedEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );
            setEvents(prevEvents =>
                prevEvents.map(ev => (ev.id === selectedEvent.id ? updatedEventFormatted : ev))
            );

            setTitle('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setDateStart('');
            setDateEnd('');
            setAllDay(false);
            setEditingEvent(false);
            setShowForm(false);
            setSelectedEvent(null);
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

            await axios.delete('https://titan-server-blush.vercel.app/delete-event', {
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

    const closeReminder = () => {
        setShowAddSendTasks(false)

    }

    const closeEditEvents = () => {
        setEditingEvent(false)
        setShowEventDetails(true)
    }

    useEffect(() => {
        const overlay = document.getElementById('overlay');
        if (showForm || showEventDetails) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }, [showForm, showEventDetails]);


    return (
        <>
            <div className='newCalendarOuter'>
                <div id="overlay" className='overlay'></div>
                <FullCalendar
                    plugins={[listPlugin]}
                    initialView='listWeek'
                    headerToolbar={false} // Disable the header toolbar
                    footerToolbar={false} // Disable the footer toolbar
                    views={{
                        listWeek: { buttonText: 'List' }
                    }}
                    editable
                    selectable
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    eventDrop={handleEventDrop}
                    height={395}
                    events={events} // Add the events property
                    displayEventTime={false}
                    eventColor='none'
                    
                />
                
            </div>

          
        </>
    );
}