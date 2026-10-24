import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    addToast: (state, action) => {
      const { text, kind = 'info' } = action.payload

      state.toasts = [...state.toasts.slice(-2), { id: crypto.randomUUID(), text, kind }]
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { addToast, removeToast } = uiSlice.actions
export const selectToasts = (state) => state.ui.toasts

export function toast(text, kind = 'info') {
  return addToast({ text, kind })
}

export default uiSlice.reducer
