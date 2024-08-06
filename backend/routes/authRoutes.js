import express from 'express';
import mongoose from 'mongoose';
import { addUser } from '../models/formModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import multer from 'multer';
import { authenticateToken } from '../routes/authenticateToken.js'
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron'

import { config } from 'dotenv';
config();


const { JWT_SECRET, EMAIL_USER, EMAIL_PASS, OPENAI_API_KEY } = process.env;




const router = express.Router();
const cronJobs = {};




// Register a user
router.post('/register', async (req, res) => {
    try {
        console.log('received data: ', req.body)
        const { name, userName, email, password, events } = req.body;

        if (!name || !userName || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }


        const userExists = await addUser.findOne({ email });


        if (userExists) {
            // console.log('this email is already registered with another account')
            return res.status(400).json({ message: 'this email is already registered with another account' });
        }
        // console.log('+++++++++++++++++++++++++++++++++')

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Initialize events as an empty map if not provided
        const userEvents = events || {};

        const newUser = await addUser.create({
            name,
            userName,
            email,
            password: hashedPassword,
            events: userEvents // Initialize events
        });

        console.log(newUser, '+++++++++++++++++++++++++++++++++')

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user: ' + error.message });
    }
});

// login users
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in the database
        const user = await addUser.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).send({ message: 'Error logging in' });
    }
});

// Protected route - fetch user profile
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




const storage = multer.memoryStorage();
const upload = multer({ storage });
const openai = new OpenAI({
    apiKey: `${OPENAI_API_KEY}` ,
});
// utils/parseNoteCards.js
function parseNoteCards(noteCardsText, classTitle) {
    if (!noteCardsText || !classTitle) {
        throw new Error('Both noteCardsText and classTitle are required');
    }

    // Split note cards text into individual entries based on double newlines
    const entries = noteCardsText.trim().split('\n\n');
    const noteCards = [];

    entries.forEach(entry => {
        // Split entry into question and answer based on newline
        const [questionLine, answerLine] = entry.split('\n');
        const question = questionLine ? questionLine.replace('Question: ', '').trim() : '';
        const answer = answerLine ? answerLine.replace('Answer: ', '').trim() : '';

        if (question && answer) {
            noteCards.push({ q1: question, a1: answer });
        }
    });

    return {
        noteCardUnique: Date.now().toString(), // Use a timestamp or a unique ID
        noteCardTitle: classTitle,
        noteCardInfo: noteCards
    };
}
router.post('/upload', authenticateToken, async (req, res) => {
    const { id: userId } = req.user;
    const { title, studyGuide, numberOfQuestions } = req.body;
    console.log(numberOfQuestions, '_____________________________________________________________________________________________________')

    if (!title || !studyGuide || !numberOfQuestions) {
        return res.status(400).json({ message: 'Title and study guide and the number of noteCards are required' });
    }

    try {
        // Find the user by ID
        const user = await addUser.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: `Generate exactly ${numberOfQuestions} comprehensive and detailed note cards from the following study guide titled "${title}". 

 For each key concept, topic, or section in the study guide, create in-depth questions that probe a deep understanding of the material. Each question should be followed by a detailed answer that thoroughly explains the concept. The format for each note card should be:
 
 - Question: [Detailed Question Here]
 - Answer: [Detailed Answer Here]
 
 The study guide is as follows:
 
 ${studyGuide}
 
 Please ensure to generate exactly ${numberOfQuestions} questions and answers from the content of the study guide. Do not generate more or less than this number of questions.
 `,
                },
            ],
            stream: false,
        });



        if (!response?.choices?.length) {
            throw new Error('No response from OpenAI');
        }

        const noteCardsText = response.choices[0].message.content.trim();
        const noteCards = parseNoteCards(noteCardsText, title);



        // Check if the note card with the same title already exists
        let noteCardExists = false;

        user.noteCard.forEach(noteCard => {
            if (noteCard.noteCardTitle === noteCards.noteCardTitle) {
                // Note card exists, append the new note cards
                noteCard.noteCardInfo.push(...noteCards.noteCardInfo);
                noteCardExists = true;
            }
        });


        if (!noteCardExists) {
            // Note card doesn't exist, add new note card
            user.noteCard.push({
                noteCardUnique: noteCards.noteCardUnique,
                noteCardTitle: noteCards.noteCardTitle,
                noteCardInfo: noteCards.noteCardInfo
            });
        }

        // Save the updated user document
        await user.save();

        return res.json({ message: 'User updated successfully', noteCard: user.noteCard });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

const scheduleEmail = (mailOptions, reminderTime, uniqueID) => {
    const cronTime = new Date(reminderTime);
    const cronExpression = `${cronTime.getSeconds()} ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;


    console.log('ADDING A JOB ')

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

    // Store the cron job in the in-memory storage
    cronJobs[uniqueID] = cronJob;

    // Log the cron job to the console
    console.log(`Scheduled email for event ${uniqueID}`);

};

const cancelScheduledEmail = (uniqueID) => {
    // Check if the cron job exists in the local memory
    console.log('cancelling a job now!')
    const cronJob = cronJobs[uniqueID];
    if (cronJob) {
        cronJob.stop(); // Stop the cron job
        delete cronJobs[uniqueID]; // Remove the cron job from local storage
        console.log(`Cancelled and removed cron job for event ${uniqueID}`);
    } else {
        console.log(`No cron job found for event ${uniqueID}`);
    }
};
function generateRandomColor() {
    // Expanded array of color hex codes that match a dark theme
    const themeColors = [
        '#3498db', // Light blue
        '#9b59b6', // Purple
        '#e74c3c', // Red
        '#1abc9c', // Turquoise
        '#f39c12', // Orange
        '#e67e22', // Carrot
        '#2980b9', // Dark blue
        '#8e44ad', // Dark purple
        '#c0392b', // Dark red
        '#16a085', // Dark turquoise
        '#2ecc71', // Green
        '#d35400', // Pumpkin
        '#27ae60', // Emerald
        '#8e44ad', // Dark violet
        '#34495e', // Wet asphalt (Dark grey-blue)
        '#2c3e50', // Midnight blue
        '#bdc3c7', // Silver
        '#95a5a6', // Concrete (grey)
        '#7f8c8d', // Asbestos (Dark grey)
        '#f1c40f', // Yellow
        '#e74c3c', // Alizarin (Bright red)
        '#ecf0f1', // Clouds (Light grey)
        '#7d3c98', // Amethyst
        '#d68910', // Sunflower
        '#1f618d', // Belize Hole (Deep blue)
        '#7fb3d5', // Glacier blue
        '#f5b041', // Bright orange
        '#48c9b0', // Light sea green
        '#f7dc6f', // Pale yellow
        '#af7ac5', // Light violet
        '#e59866', // Light orange
        '#d5dbdb', // Light silver-grey
        '#f8c471', // Peach
        '#f4d03f', // Light yellow
        '#76d7c4', // Light turquoise
        '#85c1e9', // Light sky blue
        '#a569bd', // Deep lavender
        '#f5cba7', // Light peach
        '#b2babb', // Light grey
        '#566573', // Dark blue-grey
    ];

    // Randomly select a color from the themeColors array
    const color = themeColors[Math.floor(Math.random() * themeColors.length)];
    return color;
}
router.post('/add-event', async (req, res) => {
    const { title, startTime, endTime, dateStart, dateEnd, description, reminderTime, reminderEmail } = req.body;

    if (!title || !startTime || !endTime || !dateStart || !dateEnd) {
        return res.status(400).json({ message: 'Missing event data' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        // Generate a unique color
        let eventColor;
        let isColorUnique = false;


        eventColor = generateRandomColor();



        const newEvent = {
            uniqueID: uuidv4(),
            eventName: title,
            startTime,
            endTime,
            dateStart,
            dateEnd,
            description,
            reminderTime,
            reminderEmail,
            eventColor // Add the generated color to the event
        };

        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure the event object is well-formed and use Map's set method
        user.events.set(newEvent.uniqueID, newEvent);
        await user.save();

        if (reminderTime) {
            const emailToUse = reminderEmail || user.email;
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailToUse,
                subject: `Reminder: ${title}`,
                text: `This is a reminder for your event: ${title} on ${dateStart} at ${startTime}`
            };

            console.log('Calling to add a job now!');
            scheduleEmail(mailOptions, reminderTime, newEvent.uniqueID);
            console.log('After checking if it worked');
        }

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/delete-event', async (req, res) => {
    console.log('deleting an event')


    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized' });
    }



    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const user = await addUser.findOne({ _id: userId });
        const { id } = req.body;
        const eventUniqueId = id.id;
        console.log('________________________________________________')
        console.log(userId, eventUniqueId)


        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }


        console.log('CALLING CANCEL NOW _________________________________')

        // Cancel the scheduled email before deleting the event
        cancelScheduledEmail(eventUniqueId);



        // Delete the event from the user's events
        if (user.events && user.events.has(eventUniqueId)) {
            user.events.delete(eventUniqueId);
            await user.save();
            console.log(`Deleted event ${eventUniqueId} from user ${userId}`);
            res.status(200).send({ message: 'Event deleted successfully' });
        } else {
            res.status(404).send({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).send({ message: 'Failed to delete event', error });
    }
});


router.put('/edit-event/:id', async (req, res) => {
    const { id } = req.params;
    const { title, startTime, endTime, dateStart, dateEnd, description, reminderTime, reminderEmail } = req.body;

    console.log(startTime, endTime, dateStart, dateEnd)

    if (!title || !startTime || !endTime || !dateStart || !dateEnd) {
        return res.status(400).json({ message: 'Missing event data' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const event = user.events.get(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Update event details
        event.eventName = title;
        event.startTime = startTime;
        event.endTime = endTime;
        event.dateStart = dateStart;
        event.dateEnd = dateEnd;

        event.description = description;
        event.reminderTime = reminderTime;
        event.reminderEmail = reminderEmail;

        await user.save();

        if (reminderTime) {
            const emailToUse = reminderEmail || user.email;
            const mailOptions = {
                from: EMAIL_USER,
                to: emailToUse,
                subject: `Reminder: ${title}`,
                text: `This is a reminder for your event: ${title} on ${dateStart} at ${startTime}`
            };

            await cancelScheduledEmail(id, userId); // Cancel the previous scheduled email
            await scheduleEmail(mailOptions, reminderTime, id, userId); // Schedule the new reminder email
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/update-event', async (req, res) => {
    console.log('Handling event update request');
    const { id, title, description, start, end, reminderTime, reminderEmail } = req.body;

    const authHeader = req.headers.authorization;
    console.log(title)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const user = await addUser.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const eventKey = Array.from(user.events.keys()).find(key => user.events.get(key).uniqueID === id);

        if (!eventKey) {
            return res.status(404).send({ message: 'Event not found' });
        }

        const event = user.events.get(eventKey);

        console.log('Retrieved event:', event);

        // Convert dates and times
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).send({ message: 'Invalid date format' });
        }

        event.eventName = title;
        event.description = description;
        event.startTime = new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        event.endTime = new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        event.dateStart = new Date(start).toISOString().split('T')[0];
        event.dateEnd = new Date(end).toISOString().split('T')[0];

        event.reminderTime = reminderTime;
        event.reminderEmail = reminderEmail;


        await user.save();
        res.status(200).send({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).send({ message: 'Failed to update event', error });
    }
});










router.get('/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user info in the token
        const user = await addUser.findById(userId);
        console.log(user.events)
        if (!user) return res.status(404).send('User not found');

        res.json({ events: user.events });
    } catch (error) {
        res.status(500).send('Server error');
    }
});


router.delete('/delete-noteCard', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { uniqueID } = req.query;

    if (!uniqueID) {
        return res.status(400).json({ error: 'Note card ID is required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        // Find and update the user by removing the note card from the noteCards array
        const result = await addUser.findOneAndUpdate(
            { _id: userId, 'noteCard.noteCardUnique': uniqueID },
            { $pull: { noteCard: { noteCardUnique: uniqueID } } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Note card not found or not authorized' });
        }

        res.status(200).json({ message: 'Note card deleted successfully' });
    } catch (error) {
        console.error('Error deleting note card:', error.message);
        res.status(500).json({ message: 'Server error', error });
    }
});


router.delete('/delete-noteCard-question', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { noteCardUnique, questionId } = req.query;

    if (!noteCardUnique || !questionId) {
        return res.status(400).json({ error: 'Note card ID and question ID are required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }


    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;


        const objectIdQuestionId = new mongoose.Types.ObjectId(questionId);

        console.log(objectIdQuestionId)


        const result = await addUser.findOneAndUpdate(
            {
                _id: userId,
                'noteCard.noteCardUnique': noteCardUnique,
                'noteCard.noteCardInfo._id': objectIdQuestionId // Match the specific question by ID
            },
            {
                $pull: {
                    'noteCard.$.noteCardInfo': { _id: objectIdQuestionId }
                }
            },
            {
                new: true
            }
        );

        console.log(result.noteCard[0])
        if (!result) {
            return res.status(404).json({ message: 'Failed to update note card or question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



router.patch('/edit-noteCard-question', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { noteCardUnique, questionId, q1, a1 } = req.body;

    if (!noteCardUnique || !questionId || !q1 || !a1) {
        return res.status(400).json({ error: 'Note card ID, question ID, question, and answer are required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const objectIdQuestionId = new mongoose.Types.ObjectId(questionId);

        const result = await addUser.findOneAndUpdate(
            {
                _id: userId,
                'noteCard.noteCardUnique': noteCardUnique,
                'noteCard.noteCardInfo._id': objectIdQuestionId // Match the specific question by ID
            },
            {
                $set: {
                    'noteCard.$.noteCardInfo.$[elem].q1': q1,
                    'noteCard.$.noteCardInfo.$[elem].a1': a1
                }
            },
            {
                arrayFilters: [{ 'elem._id': objectIdQuestionId }],
                new: true
            }
        );

        if (!result) {
            return res.status(404).json({ message: 'Failed to update note card or question not found' });
        }

        res.status(200).json({ message: 'Question updated successfully' });
    } catch (error) {
        console.error('Error updating question:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});




router.delete('/remove-reminder', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { eventID } = req.query; // Get eventID from query parameters

    if (!eventID) {
        return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const user = await addUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.events && user.events.has(eventID)) {
            // Cancel the scheduled reminder
            cancelScheduledEmail(eventID);

            // Optionally, remove the reminder info from the event in the database
            const event = user.events.get(eventID);
            if (event) {
                event.reminderTime = null;
                event.reminderEmail = null;
                await user.save();
                console.log(`Reminder canceled for event ${eventID}`);
            }

            res.status(200).json({ message: 'Reminder canceled successfully' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error canceling reminder:', error);
        res.status(500).json({ message: 'Failed to cancel reminder', error: error.message });
    }
});



router.get('/protected', authenticateToken, (req, res) => {
    alert('yugyhvyguitiyigygiybiygigy')
    res.status(200).json({ message: 'This is a protected route', user: req.user });
});



router.get('/testing-endpoint', (res, req) => {
    res.json({ message: 'Backend is working!' });
});






export default router;