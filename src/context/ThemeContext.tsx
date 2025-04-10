import { createContext, ParentComponent, createSignal, useContext } from 'solid-js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: () => Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<Theme>(
    localStorage.getItem('theme') as Theme || 'light'
  );

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  // Set initial theme
  if (theme() === 'dark') {
    document.documentElement.classList.add('dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};