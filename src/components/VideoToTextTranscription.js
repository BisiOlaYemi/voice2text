'use client'
import { useState } from 'react';

const VoiceNoteTranscription = () => {
  const [transcription, setTranscription] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(null);

  const handleVoiceNoteUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const voiceNoteURL = URL.createObjectURL(file);
      setVoiceNoteUrl(voiceNoteURL);
    }
  };

  const handleTranscribe = async () => {
    if (!voiceNoteUrl) {
      console.error('No voice note to transcribe.');
      return;
    }

    console.log('Transcription process initiated...');

    try {
      const audio = new Audio(voiceNoteUrl);
      audio.play();

      const recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognizer.lang = 'en-US';
      recognizer.interimResults = true;

      recognizer.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');

        setTranscription(transcript);
      };

      recognizer.onerror = (event) => {
        console.error('Error during transcription:', event.error);
      };

      recognizer.onend = () => {
        console.log('Transcription completed.');
        recognizer.stop();
      };

      recognizer.start();

      // Stop the recognition after a certain time (adjust as needed)
      setTimeout(() => {
        recognizer.stop();
      }, 5000); // Stop after 5 seconds (adjust as needed)
    } catch (error) {
      console.error('Error during transcription:', error);
    }
  };

  return (
    <div>
      <h1>Voice to Text Transcription</h1>
      <div className="mb-4">
        <label className="block font-bold mb-2">Upload Voice Note:</label>
        <input
          type="file"
          accept="audio/*"
          className="w-full p-2"
          onChange={handleVoiceNoteUpload}
        />
      </div>
      {voiceNoteUrl && (
        <div className="mb-4">
          <audio controls className="max-w-full">
            <source src={voiceNoteUrl} type="audio/wav" />
          </audio>
        </div>
      )}
      <div className="mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleTranscribe}
          disabled={!voiceNoteUrl}
        >
          Transcribe
        </button>
      </div>
      {transcription && (
        <div>
          <h2>Transcription:</h2>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceNoteTranscription;
