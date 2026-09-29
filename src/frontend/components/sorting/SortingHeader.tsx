import ThemeToggle from "./ThemeToggle";

import type {
  Theme,
} from "./ThemeToggle";


interface SortingHeaderProps {
  folderName: string;

  onBack?: () => void;

  theme: Theme;

  onThemeToggle: () => void;
}


function SortingHeader({
  folderName,
  onBack,
  theme,
  onThemeToggle,
}: SortingHeaderProps) {

  return (
    <header
      className="sorting-header"
    >

      <div
        className="sorting-header-left"
      >

        <button
          type="button"
          className="sorting-back-button"
          onClick={
            onBack
          }
          aria-label="Kembali"
          title="Kembali"
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >

            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

        </button>


        <div
          className="sorting-folder"
        >

          <span
            className="sorting-folder-label"
          >
            Folder
          </span>


          <span
            className="sorting-folder-name"
            title={folderName}
          >
            {folderName}
          </span>

        </div>

      </div>


      <div
        className="sorting-header-title"
      >
        {folderName}
      </div>


      <div
        className="sorting-header-right"
      >

        <ThemeToggle
          theme={theme}
          onToggle={
            onThemeToggle
          }
        />

      </div>

    </header>
  );
}


export default SortingHeader;