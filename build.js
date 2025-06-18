#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Environment variables for Firebase config
const firebaseConfig = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if all required environment variables are set
const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    process.exit(1);
}

// Function to replace placeholders in a file
function replacePlaceholders(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace each placeholder with actual value
    Object.entries(firebaseConfig).forEach(([key, value]) => {
        const placeholder = `"${key}"`;
        const replacement = `"${value}"`;
        content = content.replace(new RegExp(placeholder, 'g'), replacement);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

// Replace placeholders in HTML files
replacePlaceholders('index.html');
replacePlaceholders('event.html');

console.log('Build complete! Environment variables have been injected.');