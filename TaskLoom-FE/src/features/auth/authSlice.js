import { createSlice } from '@reduxjs/toolkit'

const savedToken = localStorage.getItem('taskloom-token')

const initialState = {
  user: null,
  token: savedToken || null,
  loading: Boolean(savedToken),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.loading = false
      localStorage.setItem('taskloom-token', action.payload.token)
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.loading = false
    },
    authReady: (state) => {
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.loading = false
      localStorage.removeItem('taskloom-token')
    },
  },
})

export const { setCredentials, setUser, authReady, logout } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectAuthLoading = (state) => state.auth.loading

export default authSlice.reducer
