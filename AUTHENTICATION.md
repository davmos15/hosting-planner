# Authentication System Setup Guide

This document explains the optional authentication system added to Hosting Planner.

## Overview

The authentication system is completely **optional** and maintains 100% backward compatibility. Anonymous users can continue using all existing functionality, while registered users get additional features like event ownership, multi-event management, and advanced permission controls.

## Features Added

### For All Users
- **Backward Compatibility**: All existing events continue to work unchanged
- **Optional Sign-up**: Users can choose to create accounts or continue as guests
- **Benefits Popup**: Anonymous users see encouragement to sign up with feature highlights

### For Registered Users
- **Event Ownership**: Full control over events they create
- **Multi-Event Dashboard**: View and manage all created events
- **Event History**: Track creation dates and statistics
- **Advanced Controls**: Set permissions and visibility settings

### For Event Owners
- **Permission Controls**:
  - Control whether guests can add/edit other guests
  - Control whether guests can add/edit items
  - Hide guest list or items from attendees
  - Change/remove event passwords
- **Visual Indicators**: Owner badge and settings button
- **Real-time Enforcement**: Permission changes apply immediately

## Firebase Setup Required

### 1. Enable Firebase Authentication
1. Go to your Firebase Console
2. Navigate to "Authentication" → "Get Started"
3. Click on "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

### 2. Update Firestore Security Rules
Replace your Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events: Public read, authenticated write for owned events
    match /events/{eventId} {
      allow read: if true; // Public read for sharing
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.ownerId;
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.ownerId 
            || resource.data.ownerId == null); // Allow anonymous event updates
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.ownerId;
    }
    
    // Users: Authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### 3. Environment Variables
Your existing Firebase environment variables are already configured correctly:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Database Schema Changes

### Events Collection (Extended)
```javascript
{
  // Existing fields (unchanged)
  eventId: "string",
  eventName: "string", 
  currentDate: "string",
  currentHost: "string",
  currentAddress: "string",
  guestList: ["array"],
  rsvpData: {object},
  bringItems: ["array"],
  bringData: {object},
  additionalGuests: ["array"],
  password: "string|null",
  createdAt: timestamp,
  lastUpdated: timestamp,
  
  // New authentication fields
  ownerId: "string|null",      // Firebase Auth UID of event creator
  ownerEmail: "string|null",   // Email of event creator
  permissions: {
    allowGuestEdits: boolean,  // Can guests add/edit other guests?
    allowItemEdits: boolean,   // Can guests add/edit items?
    hideGuestList: boolean,    // Hide guest list from attendees?
    hideItemsList: boolean     // Hide items list from attendees?
  }
}
```

### Users Collection (New)
```javascript
{
  email: "string",           // User's email address
  displayName: "string",     // Display name (defaults to email prefix)
  eventCount: number,        // Number of events created
  createdAt: timestamp       // Account creation time
}
```

## User Interface Changes

### Landing Page (index.html)
- **Top-right**: Sign In / Sign Up buttons (or user avatar when logged in)
- **User Dropdown**: Access to dashboard and sign out
- **Benefits Modal**: Explains premium features to anonymous users
- **Dashboard Modal**: Lists all user's events with stats and quick actions

### Event Page (event.html)
- **Top-left**: Owner badge and settings button (owners only)
- **Settings Modal**: Complete permission and password management
- **Permission Notices**: Clear indicators when actions are restricted
- **Conditional UI**: Sections hide/show based on owner settings

## Migration and Compatibility

### Existing Events
- All existing events automatically get `ownerId: null` and `ownerEmail: null`
- Default permissions are set to allow all actions (maintaining current behavior)
- Anonymous users can continue to edit these events normally
- No existing functionality is changed or removed

### New Events
- **Anonymous Users**: Events created without login get `ownerId: null`
- **Registered Users**: Events get proper ownership and default permissive settings
- **Backward Compatibility**: All events work the same regardless of ownership

## Deployment

No additional deployment steps required. The system works with your existing Vercel configuration once Firebase Authentication is enabled.

## Troubleshooting

### Authentication Not Working
1. Verify Firebase Authentication is enabled in console
2. Check that Email/Password provider is enabled
3. Ensure environment variables are set correctly in Vercel

### Permission Issues
1. Update Firestore security rules as shown above
2. Check that rules are deployed (they auto-deploy when saved)
3. Test with Firebase console simulator if needed

### UI Issues
1. Clear browser cache if auth state seems stuck
2. Check browser console for any JavaScript errors
3. Verify all Firebase scripts are loading correctly

## Security Considerations

- **Public Events**: Event data remains publicly readable for easy sharing
- **Owner Control**: Only event owners can modify their events' settings
- **Anonymous Access**: Legacy events remain editable by anyone (preserving current behavior)
- **Password Protection**: Event passwords work independently of user authentication
- **Data Privacy**: User accounts only store basic profile information

This authentication system enhances the app with powerful new features while maintaining the simplicity and accessibility that makes Hosting Planner great for casual users.