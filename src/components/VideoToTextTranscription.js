'use client'
import { useState } from 'react';

const VoiceNoteTranscription = () => {
  const [transcription, setTranscription] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState(null);

  const convertAACtoWAV = async (inputFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(reader.result);
          const offlineContext = new OfflineAudioContext({
            numberOfChannels: 1,
            length: audioBuffer.length,
            sampleRate: audioBuffer.sampleRate,
          });

          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start();

          offlineContext.oncomplete = async (event) => {
            const wavBuffer = event.renderedBuffer;
            const blob = new Blob([new Uint8Array(wavBuffer.getChannelData(0))], { type: 'audio/wav' });
            resolve(blob);
          };

          offlineContext.startRendering();
        } catch (error) {
          console.error('Error during AAC to WAV conversion:', error);
          resolve(null);
        }
      };

      reader.readAsArrayBuffer(inputFile);
    });
  };

  const handleVoiceNoteUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const isAAC = file.type === 'audio/aac';
      const convertedFile = isAAC ? await convertAACtoWAV(file) : file;
      if (convertedFile) {
        const voiceNoteURL = URL.createObjectURL(convertedFile);
        setVoiceNoteUrl(voiceNoteURL);
      }
    }
  };

  const handleTranscribe = async () => {
  if (!voiceNoteUrl) {
    console.error('No voice note to transcribe.');
    return;
  }

  console.log('Transcription process initiated...');

  try {
    const response = await fetch(voiceNoteUrl);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = async () => {
      console.log('Audio loaded, starting transcription...');
      const audioBuffer = reader.result;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const audioBufferArrayBuffer = await audioContext.decodeAudioData(audioBuffer);
        const audioBufferSourceNode = audioContext.createBufferSource();
        audioBufferSourceNode.buffer = audioBufferArrayBuffer;

        const recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognizer.lang = 'en-US';
        recognizer.interimResults = true;

        let transcriptionResult = '';
        let recognitionInProgress = true;

        recognizer.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          transcriptionResult += transcript;
          recognitionInProgress = true;
        };

        recognizer.onerror = (event) => {
          console.error('Error during transcription:', event.error);
        };

        recognizer.onend = () => {
          console.log('Transcription completed.');
          setTranscription(transcriptionResult);
          audioContext.close();
        };

        audioBufferSourceNode.connect(audioContext.destination);
        audioBufferSourceNode.start();

        recognizer.start();
        audioBufferSourceNode.onended = () => {
          // When audio playback completes, stop the recognition
          recognizer.stop();
        };
      } catch (error) {
        console.error('Error during transcription:', error);
      }
    };

    reader.onerror = (event) => {
      console.error('Error reading the uploaded audio:', event.error);
    };

    reader.readAsArrayBuffer(blob);
  } catch (error) {
    console.error('Error fetching the uploaded audio:', error);
  }
};

    

  return (
    <div>
      <h1>Voice Note to Text Transcription</h1>
      <div className="mb-4">
        <label className="block font-bold mb-2">Upload Voice Note:</label>
        <input
          type="file"
          accept="audio/*"
          className="w-full p-2 border border-gray-300 rounded"
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
