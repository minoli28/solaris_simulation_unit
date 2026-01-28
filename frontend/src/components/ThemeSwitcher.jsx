import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1 border border-slate-300 dark:border-slate-700">
            <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-all ${theme === 'light'
                        ? 'bg-white dark:bg-slate-600 text-yellow-500 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                title="Light Mode"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-all ${theme === 'dark'
                        ? 'bg-white dark:bg-slate-600 text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                title="Dark Mode"
            >
                <Moon className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-all ${theme === 'system'
                        ? 'bg-white dark:bg-slate-600 text-purple-500 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                title="System Theme"
            >
                <Monitor className="w-4 h-4" />
            </button>
        </div>
    );
}
