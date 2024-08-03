import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import '../css/Today.css';
import moment from 'moment';

export default function Today() {
  const [events, setEvents] = useState([]);

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
          
          // Get today's date in YYYY-MM-DD format
          const today = moment().format('YYYY-MM-DD');

          // Convert events object to array and filter for today's events
          const eventsArray = Object.values(userData.events)
            .filter(event => event.dateStart === today)
            .map(event => {
              const startDate = event.dateStart;
              const endDate = event.dateEnd;
              const startTime = moment(event.startTime, ['h:mm A']).format('HH:mm:ss');
              const endTime = moment(event.endTime, ['h:mm A']).format('HH:mm:ss');

              return {
                id: event.uniqueID,
                title: event.eventName,
                description: event.description,
                start: `${startDate}T${startTime}`,
                end: `${endDate}T${endTime}`,
                reminderTime: event.reminderTime // Include reminder time
              };
            });

          setEvents(eventsArray);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className='todayDivOuter'>
      <p>Today's Events</p>
      
    </div>
  );
}
