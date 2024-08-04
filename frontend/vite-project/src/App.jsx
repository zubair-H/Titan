import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import ProtectedComponent from './components/ProtectedComponenet'; // Create this component
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="application">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Titan</title>
        

 
      </Helmet>

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/protected' element={<ProtectedComponent />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  );
}

function NotFound() {
  return <h2>404 Page Not Found</h2>;
}

export default App;
