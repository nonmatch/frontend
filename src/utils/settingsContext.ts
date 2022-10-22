import { createContext } from "react";

interface Settings {
    compileDumps: boolean;
    setCompileDumps: (compileDumps: boolean) => void;
}

export const SettingsContext = createContext<Settings>({ compileDumps: false, setCompileDumps: () => { } });