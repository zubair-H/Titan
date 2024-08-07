import React from 'react';
import '../css/section2.css';
import picture from '../assets/24.png';

export default function Section2() {
  return (
    <div className='section2'>
      <div className='main-title-outer'>
        <h2 className='main-title'>Titan-Calendar</h2>
        <h2 className='main-title2'>Stay on top, effortlessly</h2>
      </div>

      <div className='subtitle-outer'>
        <p className='subtitle'>
          A calendar designed, with a philosophy of simplicity, Allowing students to Effortlessly add, edit, and manage their events with intuitive drag-and-drop functionality.
        </p>
      </div>

      <div className='content'>

        <div className='picture-outer'>

          <img className='inner-picture' src={picture} alt="Calendar Preview" />
        </div>


        <div className='text-container'>
          <h3 className='description-first'>
            Meticulously crafted to fit your individual needs, our calendar transforms your unique schedules and events into a beautifully organized experience.
          </h3>
        </div>

      </div>
    </div>
  );
}
