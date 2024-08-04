import React, { useState } from 'react';
import axios from 'axios';

const CheckBackendButton = () => {
  const [responseMessage, setResponseMessage] = useState('');

  const checkBackend = async () => {
    try {
      const response = await axios.get(`https://titan-server-nine.vercel.app/testing-endpoint`);
      setResponseMessage(response.data.message);
    } catch (error) {
      console.error('Error checking backend:', error);
      setResponseMessage('Backend request failed');
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={checkBackend}>Check Backend</button>
      <div style={styles.messageContainer}>
        {responseMessage && <p>{responseMessage}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '2px solid #000',
    borderRadius: '4px',
    padding: '16px',
    width: '300px',
    textAlign: 'center',
  },
  button: {
    padding: '10px 20px',
    border: '2px solid #000',
    backgroundColor: '#fff',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  messageContainer: {
    borderTop: '1px solid #000',
    paddingTop: '16px',
  },
};

export default CheckBackendButton;