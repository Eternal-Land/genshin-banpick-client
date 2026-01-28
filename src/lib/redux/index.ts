import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/lib/redux/auth.slice"
import themeReducer from "@/lib/redux/theme.slice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        theme: themeReducer
    }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store