import { Component } from 'solid-js';
import { Button } from "@hope-ui/solid";
import { useTheme } from '../context/ThemeContext';
import { FaSolidMoon, FaSolidSun } from 'solid-icons/fa';

export const ThemeToggle: Component = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      class="p-2 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme() === 'dark' ? (
        <FaSolidSun class="w-5 h-5 text-yellow-500" />
      ) : (
        <FaSolidMoon class="w-5 h-5 text-gray-600" />
      )}
    </Button>
  );
};