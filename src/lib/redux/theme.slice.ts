import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from ".";

export type ThemeMode = "system" | "light" | "dark";

export interface ThemeState {
	mode: ThemeMode;
}

const THEME_STORAGE_KEY = "theme";

const getInitialThemeMode = (): ThemeMode => {
	if (typeof window === "undefined") {
		return "system";
	}

	const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system") {
		return stored;
	}

	return "system";
};

const initialState: ThemeState = {
	mode: getInitialThemeMode(),
};

export const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
			state.mode = action.payload;
		},
	},
});

export const { setThemeMode } = themeSlice.actions;

export const selectThemeMode = (state: RootState) => state.theme.mode;

export default themeSlice.reducer;
