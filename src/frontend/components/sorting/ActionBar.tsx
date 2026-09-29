interface ActionBarProps {
  onDelete?: () => void;
  onMove?: () => void;
  onSave?: () => void;
}

function ActionBar({
  onDelete,
  onMove,
  onSave,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-bar-buttons">

        {/* HAPUS */}
        <button
          type="button"
          className="action-button action-button-delete"
          onClick={onDelete}
        >
          <span className="action-button-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 7H20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M9 7V4H15V7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M6 7L7 20H17L18 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M10 11V16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M14 11V16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <span className="action-button-label">
            Hapus
          </span>

          <span className="action-button-shortcut">
            Del
          </span>
        </button>

        {/* PINDAH */}
        <button
          type="button"
          className="action-button action-button-move"
          onClick={onMove}
        >
          <span className="action-button-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 7H9L11 9H20.5V19H3.5V7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M3.5 7V5H9L11 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="action-button-label">
            Pindah
          </span>

          <span className="action-button-shortcut">
            M
          </span>
        </button>

        {/* SIMPAN */}
        <button
          type="button"
          className="action-button action-button-save"
          onClick={onSave}
        >
          <span className="action-button-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12L9.5 16.5L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="action-button-label">
            Simpan
          </span>

          <span className="action-button-shortcut">
            K
          </span>
        </button>

      </div>
    </div>
  );
}

export default ActionBar;