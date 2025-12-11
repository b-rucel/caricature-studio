import React from 'react';

interface JsonDisplayProps {
  isVisible: boolean;
  onToggle: () => void;
  jsonData: unknown;
  onCopy: () => void;
  isCopied: boolean;
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({
  isVisible,
  onToggle,
  jsonData,
  onCopy,
  isCopied,
}) => {
  return (
    <>
      <button onClick={onToggle} className="json-toggle mt-4 text-sm">
        {isVisible ? '▼ Hide Prompt JSON' : '▶ Show Prompt JSON'}
      </button>

      {isVisible && (
        <div className="json-display mt-3">
          <pre>{JSON.stringify(jsonData, null, 2)}</pre>
          <button onClick={onCopy} className="copy-btn mt-2">
            {isCopied ? '✓ Copied!' : '📋 Copy JSON'}
          </button>
        </div>
      )}
    </>
  );
};
