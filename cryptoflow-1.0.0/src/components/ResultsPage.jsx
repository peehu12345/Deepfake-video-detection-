import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function ResultsPage() {
  const location = useLocation();
  const type = location.state?.type || 'video';
  const [results, setResults] = useState([]);
  const [averageConfidence, setAverageConfidence] = useState(null);
  const [overallPrediction, setOverallPrediction] = useState("");
  
  // Fetch results from backend
  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch("http://localhost:8000/api/results/", { 
          headers,
        });
        const data = await response.json();

        setResults(data.results); // [{ filename, prediction, confidence }]
        setAverageConfidence(data.average_confidence);
        setOverallPrediction(data.overall_prediction);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };

    fetchResults();
  }, []);

  const getImagePath = (filename) => {
    if (type === 'video') {
      return `http://localhost:8000/media/frames/${filename}`;
    } else if (type === 'image') {
      return `http://localhost:8000/media/images/${filename}`;
    }
    return null;
  };

  const renderFrameContent = (item, index) => {
    if (type === 'audio') {
      return (
        <div className="relative overflow-hidden rounded-lg mb-4 bg-gray-200 h-32 flex items-center justify-center">
          <span className="text-gray-500 text-lg">🎵 Audio Segment {index + 1}</span>
        </div>
      );
    } else {
      const imgSrc = getImagePath(item.filename);
      return (
        <div className="relative overflow-hidden rounded-lg mb-4">
          <img
            src={imgSrc}
            alt={`${type} ${index + 1}`}
            className="w-full h-32 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/224x128?text=Image+Not+Found";
            }}
          />
          <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${
            item.prediction.toLowerCase() === 'real' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {item.prediction}
          </div>
        </div>
      );
    }
  };

  const analysisTitle = type === 'video' ? 'Frame Analysis' : 
                        type === 'audio' ? 'Segment Analysis' : 
                        'Image Analysis';

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
            {type.charAt(0).toUpperCase() + type.slice(1)} Detection Results
          </h1>
          <p className="text-xl text-gray-200 max-w-md mx-auto drop-shadow-md">
            Comprehensive analysis of your uploaded media
          </p>
        </div>

        {/* Overall Results */}
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full mx-auto mb-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Summary</h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-lg inline-block">
              <p className="text-2xl">
                <strong>Average Confidence:</strong> {averageConfidence ? averageConfidence.toFixed(6) : 'N/A'}
              </p>
              <p className="text-2xl mt-2">
                Overall: <span className={`font-bold ${overallPrediction.toLowerCase() === 'real' ? 'text-green-300' : 'text-red-300'}`}>
                  {overallPrediction.toLowerCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {results.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full mx-auto overflow-hidden">
            <h3 className="text-3xl font-semibold mb-8 text-gray-800 text-center">{analysisTitle}</h3>
            <div className="grid grid-cols-3 gap-6">
              {results.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
                  {renderFrameContent(item, index)}
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {type.charAt(0).toUpperCase() + type.slice(1)} {index + 1}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    Confidence: {item.confidence.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;