#!/usr/bin/env node

// Simple script to replace environment variables in HTML files
console.log('Starting build process...');

const fs = require('fs');

// Environment variables for Firebase config
const firebaseConfig = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
    VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

console.log('Environment variables loaded:', Object.keys(firebaseConfig));

// Check if all required environment variables are set
const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value || value.trim() === '')
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    console.error('\nPlease set these in your Vercel dashboard under Settings → Environment Variables');
    process.exit(1);
}

// Function to replace placeholders in a file
function replacePlaceholders(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${filePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace each placeholder with actual value
        Object.entries(firebaseConfig).forEach(([key, value]) => {
            const placeholder = `"${key}"`;
            const replacement = `"${value}"`;
            content = content.replaceAll(placeholder, replacement);
        });
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${filePath}`);
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        throw error;
    }
}

try {
    // Replace placeholders in HTML files
    replacePlaceholders('index.html');
    replacePlaceholders('event.html');
    
    console.log('🎉 Build complete! Environment variables have been injected.');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}