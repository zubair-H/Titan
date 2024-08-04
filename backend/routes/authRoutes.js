import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { config } from 'dotenv';
import { addUser } from '../models/formModel.js';
import { authenticateToken } from './authenticateToken.js';

config();

const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, OPENAI_API_KEY } = process.env;

const router = express.Router();
const cronJobs = {};

const storage = multer.memoryStorage();
const upload = multer({ storage });
const openai = new OpenAI({
    apiKey: `${OPENAI_API_KEY}`,
});

// Utility Functions
function parseNoteCards(noteCardsText, classTitle) {
    if (!noteCardsText || !classTitle) {
        throw new Error('Both noteCardsText and classTitle are required');
    }

    const entries = noteCardsText.trim().split('\n\n');
    const noteCards = entries.map(entry => {
        const [questionLine, answerLine] = entry.split('\n');
        const question = questionLine ? questionLine.replace('Question: ', '').trim() : '';
        const answer = answerLine ? answerLine.replace('Answer: ', '').trim() : '';
        return question && answer ? { q1: question, a1: answer } : null;
    }).filter(card => card !== null);

    return {
        noteCardUnique: Date.now().toString(),
        noteCardTitle: classTitle,
        noteCardInfo: noteCards
    };
}

function generateRandomColor() {
    const themeColors = [
        '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#e67e22',
        '#2980b9', '#8e44ad', '#c0392b', '#16a085', '#2ecc71', '#d35400',
        '#27ae60', '#8e44ad', '#34495e', '#2c3e50', '#bdc3c7', '#95a5a6',
        '#7f8c8d', '#f1c40f', '#e74c3c', '#ecf0f1', '#7d3c98', '#d68910',
        '#1f618d', '#7fb3d5', '#f5b041', '#48c9b0', '#f7dc6f', '#af7ac5',
        '#e59866', '#d5dbdb', '#f8c471', '#f4d03f', '#76d7c4', '#85c1e9',
        '#a569bd', '#f5cba7', '#b2babb', '#566573'
    ];
    return themeColors[Math.floor(Math.random() * themeColors.length)];
}

const scheduleEmail = (mailOptions, reminderTime, uniqueID) => {
    const cronTime = new Date(reminderTime);
    const cronExpression = `${cronTime.getSeconds()} ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

    const cronJob = cron.schedule(cronExpression, () => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
                console.log(`Email sent for event ${uniqueID}`);
            }
        });
    });

    cronJobs[uniqueID] = cronJob;
    console.log(`Scheduled email for event ${uniqueID}`);
};

const cancelScheduledEmail = (uniqueID) => {
    const cronJob = cronJobs[uniqueID];
    if (cronJob) {
        cronJob.stop();
        delete cronJobs[uniqueID];
        console.log(`Cancelled and removed cron job for event ${uniqueID}`);
    } else {
        console.log(`No cron job found for event ${uniqueID}`);
    }
};

// Routes
router.post('/register', async (req, res) => {
    try {
        const { name, userName, email, password, events } = req.body;

        if (!name || !userName || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await addUser.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'This email is already registered with another account' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userEvents = events || {};
        const newUser = await addUser.create({
            name,
            userName,
            email,
            password: hashedPassword,
            events: userEvents
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user: ' + error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await addUser.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).send({ message: 'Error logging in' });
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await addUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

router.post('/upload', authenticateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { title, studyGuide, numberOfQuestions } = req.body;

    if (!title || !studyGuide || !numberOfQuestions) {
        return res.status(400).json({ message: 'Title, study guide, and number of note cards are required' });
    }

    try {
        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: `Generate exactly ${numberOfQuestions} comprehensive and detailed note cards from the following study guide titled "${title}". For each key concept, topic, or section in the study guide, create in-depth questions that probe a deep understanding of the material. Each question should be followed by a detailed answer that thoroughly explains the concept. The format for each note card should be:
                
                - Question: [Detailed Question Here]
                - Answer: [Detailed Answer Here]
                
                The study guide is as follows:
                
                ${studyGuide}
                
                Please ensure to generate exactly ${numberOfQuestions} questions and answers from the content of the study guide. Do not generate more or less than this number of questions.`,
            }],
            stream: false,
        });

        if (!response?.choices?.length) {
            throw new Error('No response from OpenAI');
        }

        const noteCardsText = response.choices[0].message.content.trim();
        const noteCards = parseNoteCards(noteCardsText, title);

        let noteCardExists = false;
        user.noteCard.forEach(noteCard => {
            if (noteCard.noteCardTitle === noteCards.noteCardTitle) {
                noteCard.noteCardInfo.push(...noteCards.noteCardInfo);
                noteCardExists = true;
            }
        });

        if (!noteCardExists) {
            user.noteCard.push(noteCards);
        }

        await user.save();
        res.json({ message: 'User updated successfully', noteCard: user.noteCard });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

router.post('/event', authenticateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { title, startTime, endTime, description, reminderTime, reminderEmail } = req.body;

    if (!title || !startTime || !endTime || !reminderTime || !reminderEmail) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const eventId = uuidv4();
    const eventColor = generateRandomColor();
    const newEvent = { eventId, title, startTime, endTime, description, reminderTime, reminderEmail, eventColor };

    try {
        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.events.push(newEvent);
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        const mailOptions = {
            from: EMAIL_USER,
            to: reminderEmail,
            subject: 'Event Reminder',
            text: `Reminder: Your event "${title}" is scheduled for ${startTime}. Description: ${description}`,
        };

        scheduleEmail(mailOptions, reminderTime, eventId);

        res.status(201).json({ message: 'Event added successfully', eventId });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

router.post('/event/delete', authenticateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' });
    }

    try {
        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const eventIndex = user.events.findIndex(event => event.eventId === eventId);
        if (eventIndex === -1) {
            return res.status(404).json({ message: 'Event not found' });
        }

        user.events.splice(eventIndex, 1);
        await user.save();

        cancelScheduledEmail(eventId);

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error.message);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

router.post('/notecard', authenticateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { classTitle, noteCardsText } = req.body;

    if (!classTitle || !noteCardsText) {
        return res.status(400).json({ message: 'Class title and note cards text are required' });
    }

    try {
        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const noteCards = parseNoteCards(noteCardsText, classTitle);

        let noteCardExists = false;
        user.noteCard.forEach(noteCard => {
            if (noteCard.noteCardTitle === noteCards.noteCardTitle) {
                noteCard.noteCardInfo.push(...noteCards.noteCardInfo);
                noteCardExists = true;
            }
        });

        if (!noteCardExists) {
            user.noteCard.push(noteCards);
        }

        await user.save();
        res.json({ message: 'User updated successfully', noteCard: user.noteCard });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

export default router;