import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ScanningAnimation = () => {
    const [scanText, setScanText] = useState("Initializing neural networks...");
    
    useEffect(() => {
        const texts = [
            "Initializing deep learning models...",
            "Extracting video frames...",
            "Analyzing facial features...",
            "Checking temporal consistency...",
            "Detecting digital artifacts...",
            "Compiling final report..."
        ];
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % texts.length;
            setScanText(texts[i]);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-md w-full mx-auto relative overflow-hidden">
            <div className="relative w-40 h-40 mb-10">
                {/* Radar/Scanner effect */}
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full opacity-10"></div>
                <div className="absolute inset-0 border-t-4 border-l-4 border-indigo-600 rounded-full animate-spin shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{animationDuration: '1.5s'}}></div>
                <div className="absolute inset-0 border-b-4 border-r-4 border-purple-500 rounded-full animate-[spin_2s_reverse_linear_infinite]"></div>
                <div className="absolute inset-8 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full animate-pulse shadow-inner"></div>
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.8)] animate-ping"></div>
            </div>
            <h3 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-widest uppercase font-mono z-10 drop-shadow-sm">
                SYSTEM SCANNING
            </h3>
            <p className="text-gray-700 font-mono font-medium text-lg h-6 z-10 transition-opacity duration-300">
                {scanText}
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-10 overflow-hidden relative z-10">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
            
            <style>{`
                @keyframes progress {
                    0% { left: -50%; }
                    100% { left: 100%; }
                }
            `}</style>
        </div>
    );
};

function UploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const reportRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const originalStyle = reportRef.current.style.transform;
      // Temporary style adjustments for html2canvas
      reportRef.current.style.transform = "none";
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      reportRef.current.style.transform = originalStyle;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Deepfake_Report_${Date.now()}.pdf`);
    } catch(err) {
      alert("Could not generate PDF: " + err.message);
    }
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setVideoFile(file);

    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setVideoPreview(null);
    }
  };

  // Handle upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      alert("Please select a video first!");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", videoFile);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const minWaitTime = 6000; // Force 6s delay for animation
    const startTime = Date.now();

    // Remove Content-Type header to let browser set it automatically for FormData
    try {
      const response = await fetch("http://localhost:8000/api/upload/", {
        method: "POST",
        body: formData,
        headers,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        alert("Upload failed: Invalid response from server");
        setIsLoading(false);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minWaitTime) {
        await new Promise(resolve => setTimeout(resolve, minWaitTime - elapsedTime));
      }

      if (response.ok && data.average_confidence !== undefined) {
        setResults(data);
        
        try {
            const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
            const logEntry = {
                id: Date.now(),
                date: new Date().toLocaleString(),
                fileName: videoFile.name,
                overallPrediction: data.overall_prediction,
                confidence: data.average_confidence,
                type: 'Video'
            };
            history.unshift(logEntry);
            localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50))); 
        } catch(e) {}
      } else {
        alert("Upload failed: " + (data.error || data.detail || "Unknown error"));
      }
    } catch (error) {
      alert("Error uploading video: " + error.message);
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
            Deepfake Detector
          </h1>
          
        </div>

        {/* Scanning Animation */}
        {isLoading && (
          <ScanningAnimation />
        )}

        {/* Upload Form */}
        {!results && !isLoading && (
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                📹 Select a Video File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Video Preview */}
            {videoPreview && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-48 md:h-64 object-cover"
                  ></video>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '🔄 Analyzing...' : '🚀 Analyze Video'}
            </Button>
          </form>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full mx-auto overflow-hidden">
            <div ref={reportRef} className="bg-white p-4 rounded-xl">
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

            <h3 className="text-3xl font-semibold mb-8 text-gray-800 text-center">Frame Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {results.results.map((frame, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={`http://localhost:8000/cryptoflow/media/frames/${frame.filename}`}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-48 object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${
                      frame.prediction.toLowerCase() === 'real' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {frame.prediction}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Frame {index + 1}</p>
                  <p className="text-base font-semibold text-gray-900">
                    Confidence: {frame.confidence.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">Confidence Score Analytics</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.results.map((f, i) => ({ name: `Fr ${i+1}`, Score: parseFloat((f.confidence * 100).toFixed(1)), isFake: f.prediction.toLowerCase() === 'fake' }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '10px' }} formatter={(val) => [`${val}%`, 'Confidence']} />
                    <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                      {
                        results.results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.prediction.toLowerCase() === 'fake' ? '#ef4444' : '#22c55e'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            </div> {/* close reportRef */}

            <div className="mt-8 flex flex-col md:flex-row gap-4">
            <Button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              📄 Download PDF Report
            </Button>

            <Button
              type="button"
              onClick={() => {
                setResults(null);
                setVideoFile(null);
                setVideoPreview(null);
              }}
               className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              🔄 Upload Another Video
            </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;