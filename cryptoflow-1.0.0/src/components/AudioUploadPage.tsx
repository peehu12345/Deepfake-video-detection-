import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

function SegmentCard({ segment, index, audioBuffer, sampleRate }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const sourceRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    let animationId = null;

    const setupVisualizer = async () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const segmentLength = sampleRate;
      const start = index * segmentLength;
      const end = Math.min(start + segmentLength, audioBuffer.length);
      const segmentData = audioBuffer.getChannelData(0).slice(start, end);

      if (segmentData.length === 0) return () => {};

      const segmentBuffer = audioContext.createBuffer(1, segmentData.length, sampleRate);
      segmentBuffer.getChannelData(0).set(segmentData);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioContext.createBufferSource();
      source.buffer = segmentBuffer;
      source.loop = true;

      // Connect source directly to analyser (no audio output)
      source.connect(analyser);
      // Do not connect analyser to destination to avoid playing sound

      source.start();

      audioContextRef.current = audioContext;
      sourceRef.current = source;

      const drawSpectrum = () => {
        const canvas = canvasRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i];

          const r = barHeight + 25 * (i / bufferLength);
          const g = 250 * (i / bufferLength);
          const b = 50;

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

          x += barWidth + 1;
        }

        animationId = requestAnimationFrame(drawSpectrum);
      };

      animationRef.current = requestAnimationFrame(drawSpectrum);
    };

    setupVisualizer();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioBuffer, sampleRate, index]);

  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
      <div className="relative overflow-hidden rounded-lg mb-4 bg-gray-100 h-48 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          className="w-full h-full"
        />
      </div>
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
        segment.prediction.toLowerCase() === 'real' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {segment.prediction}
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">Segment {index + 1}</p>
      <p className="text-base font-semibold text-gray-900">
        Confidence: {segment.confidence.toFixed(4)}
      </p>
    </div>
  );
}

function AudioUploadPage() {
  const navigate = useNavigate();
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAudioFile(file);
    setErrorMessage(''); // Clear previous errors

    if (file) {
      setAudioPreview(URL.createObjectURL(file));
    } else {
      setAudioPreview(null);
    }
  };

  // Decode audio buffer
  useEffect(() => {
    let cancelled = false;
    const decodeAudio = async () => {
      if (!audioFile || !results || audioBuffer) return;

      try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        if (!cancelled) {
          setAudioBuffer(buffer);
        }
        audioContext.close();
      } catch (error) {
        console.error('Audio decode error:', error);
      }
    };

    decodeAudio();

    return () => {
      cancelled = true;
    };
  }, [audioFile, results, audioBuffer]);

  // Handle upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      setErrorMessage("Please select an audio first!");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage("Please log in to upload audio.");
      navigate('/login');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append("file", audioFile);

    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    try {
      const response = await fetch("http://localhost:8000/api/audio-upload/", {
        method: "POST",
        body: formData,
        headers,
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response headers:', [...response.headers.entries()]); // Debug log

      const responseText = await response.text();
      console.log('Response text:', responseText); // Debug log

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        if (!response.ok) {
          setErrorMessage(`Server error (Status: ${response.status}). Response: ${responseText || 'No body'}`);
          return;
        }
      }

      if (response.ok) {
        if (data && data.average_confidence !== undefined) {
          setResults(data);
        } else {
          setErrorMessage("Unexpected response format from server.");
        }
      } else {
        // Handle specific status codes
        if (response.status === 401) {
          localStorage.removeItem('token');
          setErrorMessage("Session expired. Please log in again.");
          setTimeout(() => navigate('/login'), 1000);
          return;
        } else if (response.status === 400) {
          setErrorMessage(data?.detail || "Bad request. Please check your file.");
        } else if (response.status === 500) {
          setErrorMessage(data?.detail || "Server internal error. Please try again later.");
        } else {
          setErrorMessage(`Upload failed (Status: ${response.status}). ${data?.error || data?.detail || 'Unknown server error'}`);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage("Network error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            "url('https://www.europarl.europa.eu/resources/library/images/20230607PHT95601/20230607PHT95601_original.jpg')",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Audio Deepfake Detector
          </h1>
          <p className="text-xl text-gray-200 max-w-md mx-auto drop-shadow-md">
            Upload your audio and uncover the truth with AI-powered analysis
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/90 text-white p-4 rounded-xl mb-6 max-w-md w-full text-center shadow-lg">
            {errorMessage}
          </div>
        )}

        {/* Upload Form */}
        {!results && (
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                🎵 Select an Audio File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Audio Preview */}
            {audioPreview && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg p-4">
                  <audio
                    src={audioPreview}
                    controls
                    className="w-full"
                  ></audio>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !audioFile}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '🔄 Analyzing...' : '🚀 Analyze Audio'}
            </Button>
          </form>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full mx-auto overflow-hidden">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Detection Results</h2>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-lg inline-block">
                <p className="text-2xl">
                  <strong>Average Confidence:</strong> {results.average_confidence.toFixed(6)}
                </p>
                <p className="text-2xl mt-2">
                  Overall: <span className={`font-bold ${results.overall_prediction.toLowerCase() === 'real' ? 'text-green-300' : 'text-red-300'}`}>
                    {results.overall_prediction.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mb-8 text-gray-800 text-center">Segment Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {results.results.map((segment, index) => (
                <SegmentCard
                  key={index}
                  segment={segment}
                  index={index}
                  audioBuffer={audioBuffer}
                  sampleRate={audioBuffer?.sampleRate || 16000}
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={() => {
                setResults(null);
                setAudioFile(null);
                setAudioPreview(null);
                setAudioBuffer(null);
                setErrorMessage('');
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              🔄 Upload Another Audio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioUploadPage;