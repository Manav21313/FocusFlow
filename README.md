# FocusFlow

FocusFlow is a productivity timer web app designed to help students stay focused, track study sessions, monitor distractions, and understand their productivity patterns over time.

The app combines a focus timer, session history, analytics dashboard, Firebase authentication, and Spotify playlist integration to create a more useful study environment.

## Features

- Focus timer for study/work sessions
- Break timer after completed focus sessions
- Distraction tracking during sessions
- Productivity dashboard with study insights
- Session history with saved focus data
- Settings page for user preferences
- Firebase authentication with sign-in and sign-up
- Protected routes for logged-in users
- User-specific local data storage
- Spotify playlist integration
- Spotify-style playback control UI
- Minimal dark UI with purple glow styling
- Responsive design for desktop and mobile

## Tech Stack

- React
- Vite
- JavaScript
- CSS
- Firebase Authentication
- Spotify Web API
- Spotify Web Playback SDK
- localStorage
- Git and GitHub

## Project Purpose

The goal of FocusFlow is to solve a real student productivity problem. Many students use timers, but they do not always know how much they actually focused, what distracted them, or when they work best.

FocusFlow helps users answer questions like:

- How long did I actually focus today?
- How many distractions did I have?
- What subject did I study the most?
- Am I improving over time?
- What music helps me focus?

## Environment Variables

This project uses Firebase and Spotify, so you need a .env file in the root folder.

Create a .env file and add:

env VITE_FIREBASE_API_KEY=your_firebase_api_key VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain VITE_FIREBASE_PROJECT_ID=your_firebase_project_id VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id VITE_FIREBASE_APP_ID=your_firebase_app_id  VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id 

Do not upload your .env file to GitHub.

## How to Run Locally

Clone the project:

bash git clone https://github.com/Manav21313/FocusFlow.git 

Go into the project folder:

bash cd FocusFlow 

Install dependencies:

bash npm install 

Start the development server:

bash npm run dev 

Open the app in your browser:

text http://127.0.0.1:5173 

## Spotify Setup

To use the Spotify integration, create an app in the Spotify Developer Dashboard.

Use this redirect URI:

text http://127.0.0.1:5173/callback 

Then copy your Spotify Client ID into the .env file.

## Firebase Setup

To use authentication, create a Firebase project and enable:

- Email/Password authentication
- Google authentication

Also add these authorized domains in Firebase Authentication settings:

text localhost 127.0.0.1 

## Future Improvements

- Store focus sessions in Firestore instead of localStorage
- Add calendar view for study sessions
- Add weekly productivity reports
- Add AI study recommendations
- Add better Spotify device detection
- Add exportable study reports
- Add more detailed charts and streak tracking

## Author

Built by Manav as a real-world computer science project focused on productivity, analytics, authentication, and API integration.