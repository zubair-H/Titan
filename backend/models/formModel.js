import mongoose from "mongoose";

// Schema for individual note card objects
const noteCardSchema = new mongoose.Schema({
    noteCardUnique: { type: String, required: true },
    noteCardTitle: { type: String, required: true },
    noteCardInfo: [
        {
            q1: { type: String },
            a1: { type: String }
        }
    ]
});

// Updated eventSchema with description
const eventSchema = new mongoose.Schema({
    uniqueID: { type: String, required: true },
    eventName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    dateStart: { type: String, required: true },
    dateEnd: { type: String, required: true },
    description: { type: String, default: '' },
    reminderTime: { type: String, required: false },
    reminderEmail: { type: String, required: false },
    eventColor: { type: String, required: false },

});

// Register schema
const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
   
    pdfText: {
        type: String, // Store the PDF as a buffer
        required: false
    },
    pdftitle: {
        type: String,
        required: false
    },
    extractedInfo: {
        type: Object,
        required: false
    },
    isEmpty: {
        type: Boolean,
        required: false
    },
    recStartTime: {
        type: String
    },
    recEndTime: {
        type: String,
        required: false
    },
    lecStartTime: {
        type: String,
        required: false
    },
    lecEndTime: {
        type: String,
        required: false
    },
    events: {
        type: Map,
        of: eventSchema
    },
    // Add the noteCard field here
    noteCard: [noteCardSchema]
});

export const addUser = mongoose.model('addUser', registerSchema);
