import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialValue?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialValue = '' }) => {
  const [key, setKey] = useState(initialValue);

  useEffect(() => {
    setKey(initialValue || '');
  }, [initialValue, isOpen]);

  const handleSave = () => {
    onSave(key.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Gemini API Key">
      <div className="space-y-4">
        <p>
          Enter your personal Google Gemini API key. It is stored locally in your browser and used only from your device.
        </p>
        <div className="space-y-2">
          <label htmlFor="gemini-api-key" className="block text-sm text-neutral-400">API Key</label>
          <input
            id="gemini-api-key"
            type="password"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="AIza..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Key
          </button>
        </div>
        <div className="text-xs text-neutral-500">
          Don’t have a key? Create one in your Google AI Studio account.
        </div>
      </div>
    </Modal>
  );
};

export default ApiKeyModal;
