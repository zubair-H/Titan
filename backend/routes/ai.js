// pdfExtract.js

import axios from 'axios';
import { AI } from '../config';

// Function to extract PDF text using OpenAI's API
export  async function extractPdfText(user) {
    const { pdfText } = user;

    const apiKey = `${AI}`; // Replace with your OpenAI API key
    const endpoint = 'https://api.openai.com/v1/engines/davinci-codex/completions'; // Adjust endpoint as per OpenAI's API

    try {
        const response = await axios.post(endpoint, {
            prompt: pdfText,
            max_tokens: 150,
            stop: ['\n', '###']
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // Assuming OpenAI returns JSON data with extracted information
        const extractedInfo = response.data.choices[0].text.trim(); // Adjust as per OpenAI's API response structure

        // Update user object with extracted information
        user.extractedInfo = extractedInfo;
        await user.save(); // Assuming user is a Mongoose model instance

        return extractedInfo; // Return extracted information if needed
    } catch (error) {
        console.error('Error extracting PDF text from OpenAI:', error);
        throw new Error('Error extracting PDF text from OpenAI');
    }
}
