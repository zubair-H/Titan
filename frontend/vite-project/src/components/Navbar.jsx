import React, { useState, useEffect } from 'react';
import '../css/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleRegButton = () => {
    console.log('this button is working');
    // navigate('/login');

  }

  const handleHomeButton = () => {
    console.log('this button is working');
    navigate('/login');
  }

  const move = (async (e) => {

    try {

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login')
      }
      else {
        navigate('/protected')
      }



    } catch (error) {


    }
  })


  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  }




  return (
    <div className='divOuter'>
      <nav className={`navBarContainer ${menuOpen ? 'menu-open' : ''}`}>
        <Link className={`titan-logo ${menuOpen ? 'close-titan-logo' : ""}`} to="/">Titan</Link>
        <div className={`navOuter ${menuOpen ? 'menu-open' : ''}`}>
          <div className="nav">
            <Link className="active" to="/">Home</Link>
            <button className='login-button' onClick={move} >Login</button>
            <button className='register-btn' onClick={move}>Register Now &rarr;</button>
          </div>
        </div>
        <div className='hamburger-btn' onClick={toggleMenu}>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
        </div>
      </nav>
      <div id="overlay" className={menuOpen ? 'active' : ''} onClick={toggleMenu}></div>
    </div>
  );
}
