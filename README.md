# Hosting Planner

A real-time event planning web application that makes coordinating gatherings simple and efficient. Create events, manage RSVPs, coordinate what guests bring, and share updates - all without requiring sign-ups or downloads.

## 🌟 Features

### Event Management
- **Quick Event Creation**: Set up events in seconds with name, date, location, and initial guest list
- **Unique Event URLs**: Each event gets its own shareable link (e.g., `birthday-party-abc123`)
- **Password Protection**: Optional passwords for private events
- **Multi-Event Support**: Create and manage multiple events simultaneously

### Guest Coordination
- **Easy RSVP System**: Three simple states - Attending, Pending, Can't Make It
- **Group Management**: Add families or groups with custom headcounts
- **Real-time Updates**: All changes sync instantly across all devices
- **Guest Filtering**: Click status counts to filter and view specific guest groups

### Item Organization
- **What to Bring**: Create lists of needed items for your event
- **Claim System**: Guests can claim items they'll bring
- **Drag & Drop**: Reorder items by importance
- **Visual Status**: Clear indicators for what's covered vs. still needed

### Sharing & Communication
- **One-Click Sharing**: Generate formatted summaries for messaging apps
- **Live Status**: See who's online and when changes are saved
- **No App Required**: Works in any web browser on any device

## 🚀 Getting Started

### For Users
1. Visit the hosted application
2. Click "Create New Event"
3. Fill in your event details
4. Share the generated URL with your guests

### For Developers

#### Prerequisites
- Node.js (for local development)
- Firebase account (free tier works)
- Vercel account (for deployment)

#### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/hosting-planner.git
cd hosting-planner

# Start local server
python3 -m http.server 8000
# or
npx http-server -p 8000

# Visit http://localhost:8000
```

#### Firebase Setup
1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Update the Firebase configuration in `index.html` and `event.html`
4. Set Firestore rules (see Security section)

#### Deployment

**Environment Variables Setup (Required)**
Before deploying, you must set up Firebase environment variables:

1. In your Vercel dashboard, go to Settings → Environment Variables
2. Add these variables with your Firebase config values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN` 
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

**Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

## 🛡️ Security

### Current Setup
- Open access for event creation and participation
- Optional password protection per event
- Client-side password validation
- Session-based password storage

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note**: These rules allow public read/write. For production with sensitive data, consider adding authentication.

## 📁 Project Structure

```
hosting-planner/
├── index.html      # Landing page with event creation
├── event.html      # Main event management interface
├── styles.css      # Shared styles
├── middleware.js   # Vercel security headers
├── package.json    # Dependencies
└── README.md       # This file
```

## 🔧 Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase Firestore
- **Hosting**: Vercel
- **Real-time Sync**: Firestore listeners
- **No Build Process**: Pure client-side application

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Android)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with Firebase for real-time synchronization and Vercel for hosting.

---

Made with ❤️ for easy event planning