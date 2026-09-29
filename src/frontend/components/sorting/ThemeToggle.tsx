import {
  useEffect,
  useState,
} from "react";


type Theme =
  | "light"
  | "dark";


function getInitialTheme(): Theme {
  try {
    const savedTheme =
      localStorage.getItem(
        "archio-theme",
      );


    if (
      savedTheme === "dark"
    ) {
      return "dark";
    }


    return "light";

  } catch {
    return "light";
  }
}


function applyTheme(
  theme: Theme,
) {
  const root =
    document.documentElement;

  const body =
    document.body;


  root.dataset.theme =
    theme;

  body.dataset.theme =
    theme;


  root.style.colorScheme =
    theme;


  try {
    localStorage.setItem(
      "archio-theme",
      theme,
    );
  } catch {
    // Ignore localStorage errors.
  }
}


function ThemeToggle() {
  const [theme, setTheme] =
    useState<Theme>(
      getInitialTheme,
    );


  const isDark =
    theme === "dark";


  /* =======================================================
     APPLY INITIAL THEME
  ======================================================= */

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      document.body.dataset.theme =
        "";

      document.documentElement.dataset.theme =
        "";
    };
  }, []);


  /* =======================================================
     TOGGLE
  ======================================================= */

  const handleToggle =
    () => {
      setTheme(
        (previous) =>
          previous === "dark"
            ? "light"
            : "dark",
      );
    };


  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={
        handleToggle
      }
      aria-label={
        isDark
          ? "Gunakan mode terang"
          : "Gunakan mode gelap"
      }
      title={
        isDark
          ? "Mode terang"
          : "Mode gelap"
      }
    >

      <span
        className={`theme-toggle-track ${
          isDark
            ? "theme-toggle-track-dark"
            : ""
        }`}
      >

        {/* SUN */}

        <span
          className="
            theme-toggle-icon
            theme-toggle-sun
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="4"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="
                M12 2V4
                M12 20V22
                M2 12H4
                M20 12H22
              "
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="
                M4.93 4.93L6.34 6.34
                M17.66 17.66L19.07 19.07
              "
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="
                M19.07 4.93L17.66 6.34
                M6.34 17.66L4.93 19.07
              "
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>


        {/* MOON */}

        <span
          className="
            theme-toggle-icon
            theme-toggle-moon
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="
                M21 14.5
                C19.8 15.1 18.45 15.45 17 15.45
                C12.35 15.45 8.55 11.65 8.55 7
                C8.55 5.55 8.9 4.2 9.5 3
                C5.75 4.1 3 7.55 3 11.65
                C3 16.8 7.2 21 12.35 21
                C16.45 21 19.9 18.25 21 14.5Z
              "
            />
          </svg>
        </span>


        {/* THUMB */}

        <span
          className={`theme-toggle-thumb ${
            isDark
              ? "theme-toggle-thumb-dark"
              : ""
          }`}
        />

      </span>

    </button>
  );
}


export default ThemeToggle;