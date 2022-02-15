import React, { useState, useEffect } from 'react';
import { ThemeContext, themes } from './contexts/ThemeContext';
import Cookies from 'js-cookie'

export default function ThemeContextWrapper(props) {
  const [theme, setTheme] = useState(Cookies.get('theme') || themes.light);

  function changeTheme(theme) {
    setTheme(theme);
  }

  useEffect(() => {
    Cookies.set('theme', theme)
    switch (theme) {
      case themes.light:
        document.body.classList.remove('dark-mode-content');
        break;
      case themes.dark:
      default:
        document.body.classList.add('dark-mode-content');
        break;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: theme, changeTheme: changeTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}