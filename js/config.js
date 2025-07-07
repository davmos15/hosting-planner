// js/config.js - Firebase Configuration and Initialization

// Firebase Configuration - loaded from environment variables during build
const firebaseConfig = {
    apiKey: "VITE_FIREBASE_API_KEY",
    authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    projectId: "VITE_FIREBASE_PROJECT_ID",
    storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    appId: "VITE_FIREBASE_APP_ID",
    measurementId: "VITE_FIREBASE_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services for use in other modules
window.db = firebase.firestore();
window.auth = firebase.auth();

// Global state variables
window.currentUser = null;
window.currentEventId = null;
window.currentEventPassword = null;
window.eventOwner = null;
window.eventPermissions = {
    allowGuestView: true,
    allowGuestEdits: true,
    allowItemView: true,
    allowItemEdits: true
};

// Event data
window.guestList = [];
window.bringItems = [];
window.rsvpData = {};
window.bringData = {};
window.additionalGuests = [];
window.currentHost = '';
window.currentDate = '';
window.currentEventName = 'Hosting Planner';
window.currentAddress = '';
window.currentFilter = null;
window.currentGuestName = null;

// Guest search state
window.selectedGuestName = null;
window.selectedGuestType = null;
window.authMode = 'signin';

console.log('Firebase initialized and global state set up');