import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const placeholderValues = new Set([
  'your_firebase_api_key',
  'your_project.firebaseapp.com',
  'your_project_id',
  'your_project.appspot.com',
  'your_messaging_sender_id',
  'your_firebase_app_id',
])

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const isMissingConfigValue = (value) =>
  !value || placeholderValues.has(value) || value.startsWith('your_')

export const missingFirebaseConfig = requiredConfigKeys.some(
  (key) => isMissingConfigValue(firebaseConfig[key]),
)

export const firebaseConfigError =
  'Firebase Authentication is not configured. Add real Firebase web app values to your local .env file, then restart the dev server.'

const app = missingFirebaseConfig ? null : initializeApp(firebaseConfig)

export const auth = app ? getAuth(app) : null
export const googleProvider = app ? new GoogleAuthProvider() : null

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' })
}
