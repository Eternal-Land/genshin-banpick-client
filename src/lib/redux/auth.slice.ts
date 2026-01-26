import type { ProfileResponse } from "@/apis/auth/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";

export interface AuthState {
    profile: ProfileResponse | null;
}

const initialState: AuthState = {
    profile: null,
}

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<ProfileResponse | null>) => {
            state.profile = action.payload;
        }
    }
})

export const { setProfile } = authSlice.actions;

export const selectAuthProfile = (state: RootState) => state.auth.profile;

export default authSlice.reducer;