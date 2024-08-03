import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ProtectedNavBar.css';
import NewCalendar from './NewCalendar';
import axios from 'axios';
import Titan from './Titan';
import Today from './Today';
import NoteCards from './NoteCards';

export default function ProtectedNavBar() {
    const [showNav, setShowNav] = useState(true);
    const [navAnimating, setNavAnimating] = useState(false);
    const [calTransition, setCalTransition] = useState(false); // State for calendar transition
    const [activeLink, setActiveLink] = useState('titan'); // Set 'titan' as the default
    const [noteCards, setNoteCards] = useState([]);
    const [userName, setUserName] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    const navigate = useNavigate();
    const [menuVisible, setMenuVisible] = useState(false);



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

                const { name, noteCard } = response.data;

                const noteCardsArray = Object.values(noteCard).map(noteCard => ({
                    uniqueID: noteCard.noteCardUnique,
                    title: noteCard.noteCardTitle,
                    color: noteCard.color
                }));

                setNoteCards(noteCardsArray);

                const capitalizeFirstLetter = (str) => {
                    return str.charAt(0).toUpperCase() + str.slice(1);
                };

                setUserName(capitalizeFirstLetter(name));

                const currentDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                setCurrentDate(currentDate);
            } catch (error) {
                console.error('Error fetching user profile:', error.message);
            }
        };

        fetchUserData();
    }, [navigate]);

    useEffect(() => {
        const overlay = document.getElementById('overlay');
        if (menuVisible) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }, [menuVisible]);

    const logout = () => {
        localStorage.removeItem('authToken');
        navigate('/home');
    };

    const hideNavBar = () => {
        setNavAnimating(true);
        setTimeout(() => {
            setShowNav(prevState => !prevState);
            setNavAnimating(false);
        }, 300);
    };

    const transitionCalendarDiv = () => {
        setCalTransition(true);
        setShowNav(true);

        setTimeout(() => {
            setCalTransition(false);
        }, 0);
    };

    const handleLinkClick = (link) => {
        transitionCalendarDiv();
        setActiveLink(link);
    };

    const toggleMenu = () => {
        setNavAnimating(true);
        setTimeout(() => {
            setMenuVisible(prevState => !prevState);
            setNavAnimating(false);
        }, 300);
    };

    const toggleMenu2 = () => {
        setNavAnimating(true);
        setMenuVisible(prevState => !prevState);
        setNavAnimating(false);

    };


    const handleLinkClickAndHideMenu = (link) => {
        handleLinkClick(link);
        setMenuVisible(false);
    };

    return (
        <div className={`outerDivNav ${showNav ? '' : 'nav-hidden'}`}>

            <div className='hamburgerButtonOuter2'>
                <button className='hamburgerButton' onClick={toggleMenu2}>
                    <span className='hamburgerIcon'></span>
                    <span className='hamburgerIcon'></span>
                    <span className='hamburgerIcon'></span>
                </button>
                {menuVisible && (

                    <div className={`horizontal-nav${navAnimating ? ' nav-animating2' : ''}`}>

                        <button className='hamburgerButton' onClick={toggleMenu}>
                            <span className='hamburgerIcon'></span>
                            <span className='hamburgerIcon'></span>
                            <span className='hamburgerIcon'></span>
                        </button>
                        <div className='navOuter4'>
                            <h2 className='introMenu'>Welcome {userName}</h2>
                            <h2>{currentDate}</h2>
                        </div>
                        <div className='navOuter3'>
                            <p className='titleTasks'>Work</p>
                            <a
                                className={`active ${activeLink === 'titan' ? 'highlight' : ''}`}
                                onClick={() => handleLinkClickAndHideMenu('titan')}
                            >
                                &#10095; Meet Titan
                            </a>
                            <a
                                className={`active ${activeLink === 'calendar' ? 'highlight' : ''}`}
                                onClick={() => handleLinkClickAndHideMenu('calendar')}
                            >
                                &#x1F4C5; Calendar
                            </a>
                            <a
                                className={`active ${activeLink === 'noteCard' ? 'highlight' : ''}`}
                                onClick={() => handleLinkClickAndHideMenu('noteCard')}
                            >
                                Note Cards
                            </a>
                        </div>
                        <div className='navOuter2'>
                            <p className='operation2'>Other</p>
                            <a className="active" onClick={() => { navigate('/home'); setMenuVisible(false); }}>Home</a>
                            <a className="active" onClick={() => { logout(); setMenuVisible(false); }}>Logout</a>
                            <a className="active" onClick={() => setMenuVisible(false)}>Contact</a>
                        </div>
                    </div>
                )}
            </div>

            {
                showNav && (
                    <div className={`navbar ${navAnimating ? 'nav-animating' : ''}`}>
                        <div className='navbarOuter'>
                            <nav className='navContainer'>
                                <div className='firstPart'>
                                    <p className='Menu'>Menu</p>
                                    <div className='hamburgerButtonOuter'>
                                        <button className='hamburgerButton' onClick={hideNavBar}>
                                            <span className='hamburgerIcon'></span>
                                            <span className='hamburgerIcon'></span>
                                            <span className='hamburgerIcon'></span>

                                        </button>
                                    </div>
                                </div>
                                <div className='navOuter4'>
                                    <h2 className='introMenu'>Welcome {userName}</h2>
                                    <h2>{currentDate}</h2>
                                </div>
                                <div className='navOuter3'>
                                    <p className='titleTasks'>Work</p>
                                    <a
                                        className={`active ${activeLink === 'titan' ? 'highlight' : ''}`}
                                        onClick={() => handleLinkClick('titan')}
                                    >
                                        &#10095; Meet Titan
                                    </a>
                                    <a
                                        className={`active ${activeLink === 'calendar' ? 'highlight' : ''}`}
                                        onClick={() => handleLinkClick('calendar')}
                                    >
                                        &#x1F4C5; Calendar
                                    </a>
                                    <a
                                        className={`active ${activeLink === 'noteCard' ? 'highlight' : ''}`}
                                        onClick={() => handleLinkClick('noteCard')}
                                    >
                                        Note Cards
                                    </a>
                                </div>
                                <div className='navOuter2'>
                                    <p className='operation2'>Other</p>
                                    <a className="active" onClick={() => navigate('/home')}>Home</a>
                                    <a className="active" onClick={logout}>Logout</a>
                                    <a className="active">Contact</a>
                                </div>
                            </nav>
                        </div>
                    </div>
                )
            }

            <div className={`calenderDivOuter ${calTransition ? 'cal-transition' : ''}`}>
                {!showNav && (
                    <div>
                        <a className='hiddenBtn' onClick={transitionCalendarDiv}>&#10095;</a>
                    </div>
                )}
                {activeLink === 'calendar' && <NewCalendar />}
                {activeLink === 'titan' && <Titan />}
                {activeLink === 'noteCard' && <NoteCards />}
                {activeLink === 'Reminders' && <Today />}
            </div>

            <div id="overlay" className={menuVisible ? 'active' : ''}></div>
        </div >
    );
}
