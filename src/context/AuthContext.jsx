import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  auth,
  firebaseConfigError,
  googleProvider,
  missingFirebaseConfig,
} from '../firebase'
import { clearSafeUser, saveSafeUser } from '../utils/storage'
import { AuthContext } from './authContextValue'

const getSafeUser = (firebaseUser) => ({
  uid: firebaseUser.uid,
  displayName: firebaseUser.displayName || '',
  email: firebaseUser.email || '',
  emailVerified: firebaseUser.emailVerified,
})

const safeErrorMessages = {
  'auth/email-already-in-use':
    'An account with this email may already exist. Try signing in or resetting your password.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/configuration-not-found':
    'Firebase Authentication is not enabled for this project. In Firebase console, open Authentication, click Get started, then enable Email/Password or Google sign-in.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled for this Firebase project.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email. Sign in with the original method first.',
  'auth/cancelled-popup-request':
    'A Google sign-in window is already open. Complete it or try again.',
  'auth/popup-blocked':
    'Your browser blocked the Google sign-in popup. Redirecting to Google sign-in instead.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it completed.',
  'auth/too-many-requests':
    'Too many attempts. Please wait before trying again.',
  'auth/unauthorized-domain':
    'This domain is not authorized for Firebase Authentication. Add it in Firebase console.',
  'auth/user-disabled': 'This account cannot sign in. Contact support for help.',
  'auth/weak-password': 'Use a stronger password before creating an account.',
}

const getSafeAuthMessage = (error) =>
  safeErrorMessages[error?.code] || 'Authentication failed. Please try again.'

const createAuthError = (message) => {
  const error = new Error(message)
  error.safeMessage = message
  return error
}

const ensureAuth = async () => {
  if (!auth) {
    throw createAuthError(firebaseConfigError)
  }

  await setPersistence(auth, browserSessionPersistence)
  return auth
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(auth))
  const [authError, setAuthError] = useState('')

  const syncVerifiedUser = useCallback(async (nextFirebaseUser) => {
    if (!auth || !nextFirebaseUser) {
      clearSafeUser()
      setFirebaseUser(null)
      setUser(null)
      return null
    }

    try {
      await nextFirebaseUser.reload()
    } catch {
      // Firebase may be offline; keep the last known auth state safe.
    }

    const refreshedUser = auth.currentUser || nextFirebaseUser

    setFirebaseUser(refreshedUser)

    if (!refreshedUser.emailVerified) {
      clearSafeUser()
      setUser(null)
      return null
    }

    const safeUser = getSafeUser(refreshedUser)
    saveSafeUser(safeUser)
    setUser(safeUser)
    setAuthError('')

    return safeUser
  }, [])

  useEffect(() => {
    if (!auth) {
      clearSafeUser()
      return undefined
    }

    let active = true
    let unsubscribe = () => {}

    const subscribeToAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence)
      } catch {
        if (!active) return

        clearSafeUser()
        setFirebaseUser(null)
        setUser(null)
        setLoading(false)
        return
      }

      if (!active) return

      try {
        await getRedirectResult(auth)
      } catch (error) {
        if (!active) return

        setAuthError(getSafeAuthMessage(error))
      }

      unsubscribe = onAuthStateChanged(auth, async (nextFirebaseUser) => {
        if (!active) return

        if (!nextFirebaseUser) {
          clearSafeUser()
          setFirebaseUser(null)
          setUser(null)
          setLoading(false)
          return
        }

        await syncVerifiedUser(nextFirebaseUser)
        setLoading(false)
      })
    }

    subscribeToAuth()

    return () => {
      active = false
      unsubscribe()
    }
  }, [syncVerifiedUser])

  const signUp = useCallback(async ({ name, email, password }) => {
    try {
      const firebaseAuth = await ensureAuth()
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      )

      await updateProfile(credential.user, { displayName: name })
      await sendEmailVerification(credential.user)
      await signOut(firebaseAuth)

      return 'Account created. Check your inbox to verify your email before signing in.'
    } catch (error) {
      throw createAuthError(error.safeMessage || getSafeAuthMessage(error))
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    try {
      const firebaseAuth = await ensureAuth()
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      )

      await credential.user.reload()

      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user)
        } catch {
          // Avoid leaking verification email rate-limit details.
        }

        await signOut(firebaseAuth)
        throw createAuthError(
          'Please verify your email before signing in. Check your inbox for the verification link.',
        )
      }

      const safeUser = await syncVerifiedUser(credential.user)

      return safeUser
    } catch (error) {
      throw createAuthError(error.safeMessage || getSafeAuthMessage(error))
    }
  }, [syncVerifiedUser])

  const signInWithGoogle = useCallback(async () => {
    try {
      const firebaseAuth = await ensureAuth()

      if (!googleProvider) {
        throw createAuthError(firebaseConfigError)
      }

      const credential = await signInWithPopup(firebaseAuth, googleProvider)
      const safeUser = await syncVerifiedUser(credential.user)

      if (!safeUser) {
        await signOut(firebaseAuth)
        throw createAuthError(
          'This Google account must have a verified email before continuing.',
        )
      }

      return safeUser
    } catch (error) {
      if (error?.code === 'auth/popup-blocked') {
        const firebaseAuth = await ensureAuth()
        await signInWithRedirect(firebaseAuth, googleProvider)
        return null
      }

      throw createAuthError(error.safeMessage || getSafeAuthMessage(error))
    }
  }, [syncVerifiedUser])

  const resetPassword = useCallback(async (email) => {
    try {
      const firebaseAuth = await ensureAuth()
      await sendPasswordResetEmail(firebaseAuth, email)
    } catch (error) {
      if (error.safeMessage) {
        throw error
      }

      if (
        error?.code !== 'auth/user-not-found' &&
        error?.code !== 'auth/invalid-credential'
      ) {
        throw createAuthError(getSafeAuthMessage(error))
      }
    }

    return 'If an account uses that email, a password reset link has been sent.'
  }, [])

  const logout = useCallback(async () => {
    if (auth) {
      await signOut(auth)
    }

    clearSafeUser()
    setFirebaseUser(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      firebaseUser,
      user,
      loading,
      authError,
      isConfigured: !missingFirebaseConfig,
      configError: missingFirebaseConfig ? firebaseConfigError : '',
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword,
      logout,
    }),
    [
      firebaseUser,
      authError,
      loading,
      logout,
      resetPassword,
      signIn,
      signInWithGoogle,
      signUp,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
