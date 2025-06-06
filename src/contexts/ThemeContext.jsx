import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [colorScheme, setColorScheme] = useState('modern');

  useEffect(() => {
    // Load saved preferences
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedColorScheme = localStorage.getItem('colorScheme') || 'modern';
    
    setDarkMode(savedDarkMode);
    setColorScheme(savedColorScheme);
    
    // Apply theme
    document.body.classList.toggle('dark-mode', savedDarkMode);
    document.body.classList.add(`${savedColorScheme}-scheme`);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue);
      document.body.classList.toggle('dark-mode', newValue);
      return newValue;
    });
  };

  const changeColorScheme = (scheme) => {
    setColorScheme(scheme);
    localStorage.setItem('colorScheme', scheme);
    
    // Remove all scheme classes
    document.body.classList.remove(
      'default-scheme',
      'red-scheme',
      'blue-scheme',
      'green-scheme',
      'purple-scheme',
      'modern-scheme'
    );
    
    // Add new scheme class
    document.body.classList.add(`${scheme}-scheme`);
  };

  const value = {
    darkMode,
    colorScheme,
    toggleDarkMode,
    changeColorScheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};