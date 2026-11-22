import { createSlice } from '@reduxjs/toolkit'

const savedToken = localStorage.getItem('taskloom-token')

const initialState = {
  user: null,
  token: savedToken || null,
  loading: Boolean(savedToken),
  // True after the user clicks "Sign out", so the next sign-in starts at the home page
  // instead of returning to whatever page they were on.
  signedOut: false,
}

function clearSession(state) {
  state.user = null
  state.token = null
  state.loading = false
  localStorage.removeItem('taskloom-token')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.loading = false
      state.signedOut = false
      localStorage.setItem('taskloom-token', action.payload.token)
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.loading = false
    },
    authReady: (state) => {
      state.loading = false
    },
    // Session lost (expired or invalid token): remember the page so we can return to it.
    logout: (state) => {
      clearSession(state)
      state.signedOut = false
    },
    // The user chose to sign out.
    signOut: (state) => {
      clearSession(state)
      state.signedOut = true
    },
  },
})

export const { setCredentials, setUser, authReady, logout, signOut } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectAuthLoading = (state) => state.auth.loading
export const selectSignedOut = (state) => state.auth.signedOut

export default authSlice.reducer
