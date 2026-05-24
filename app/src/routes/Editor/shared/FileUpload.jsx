import { useRef } from 'react';
import { Button } from './Button';

export const FileUpload = ({ onFileLoad, accept = '.json' }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        onFileLoad(data);
      } catch (error) {
        alert('Error parsing JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        Import JSON
      </Button>
    </div>
  );
};
