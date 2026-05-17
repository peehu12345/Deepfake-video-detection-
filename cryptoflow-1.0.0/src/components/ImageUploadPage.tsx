import React, { useState } from "react";
import { Button } from "@/components/ui/button";

function ImageUploadPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  // Handle upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("Please select an image first!");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", imageFile);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type header to let browser set it automatically for FormData
    try {
      const response = await fetch("http://localhost:8000/api/upload-image/", {
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
        return;
      }

      if (response.ok && data.average_confidence !== undefined) {
        setResults(data);
      } else {
        alert("Upload failed: " + (data.error || data.detail || "Unknown error"));
      }
    } catch (error) {
      alert("Error uploading image: " + error.message);
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
            Image Deepfake Detector
          </h1>
          <p className="text-xl text-gray-200 max-w-md mx-auto drop-shadow-md">
            Upload your image and uncover the truth with AI-powered analysis
          </p>
        </div>

        {/* Upload Form */}
        {!results && (
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                🖼️ Select an Image File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 md:h-64 object-cover"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? '🔄 Analyzing...' : '🚀 Analyze Image'}
            </Button>
          </form>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full mx-auto overflow-hidden">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Detection Results</h2>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow-lg inline-block">
                <p className="text-2xl">
                  <strong>Confidence:</strong> {results.average_confidence.toFixed(6)}
                </p>
                <p className="text-2xl mt-2">
                  Overall: <span className={`font-bold ${results.overall_prediction.toLowerCase() === 'real' ? 'text-green-300' : 'text-red-300'}`}>
                    {results.overall_prediction.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>

            {results.results && results.results.length > 0 && (
              <>
                <h3 className="text-3xl font-semibold mb-8 text-gray-800 text-center">Image Analysis</h3>
                <div className="grid grid-cols-1 gap-6 mb-10">
                  {results.results.map((analysis, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 text-center">
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <img
                          src={`http://localhost:8000/cryptoflow/media/images/${analysis.filename || 'processed.jpg'}`}
                          alt={`Analysis ${index + 1}`}
                          className="w-full h-64 object-cover mx-auto"
                        />
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${
                          analysis.prediction.toLowerCase() === 'real' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {analysis.prediction}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Analysis {index + 1}</p>
                      <p className="text-base font-semibold text-gray-900">
                        Confidence: {analysis.confidence.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              type="button"
              onClick={() => {
                setResults(null);
                setImageFile(null);
                setImagePreview(null);
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              🔄 Upload Another Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploadPage;