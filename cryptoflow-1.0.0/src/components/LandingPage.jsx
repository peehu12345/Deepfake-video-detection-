import React, { useState } from "react";

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setVideoFile(file);
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Handle upload (connect this to your Django backend API)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return;

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload_video/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Upload Success:", data);
      // You can redirect or display results here
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="bg-gray-100">
      {/* Navbar */}
      <section className="w-full px-8 text-gray-700 bg-white">
        <div className="container flex flex-col flex-wrap items-center justify-between py-5 mx-auto md:flex-row max-w-7xl">
          <div className="relative flex flex-col md:flex-row">
            <a href="#_" className="flex items-center mb-5 font-medium text-gray-900 md:mb-0">
              <span className="mx-auto text-xl font-black leading-none text-gray-900 select-none">
                DeepFaker<span className="text-indigo-600">.</span>
              </span>
            </a>
            <nav className="flex flex-wrap items-center mb-5 text-base md:mb-0 md:pl-8 md:ml-8 md:border-l md:border-gray-200">
              <a href="#_" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">
                Home
              </a>
              <a href="#_" className="mr-5 font-medium leading-6 text-gray-600 hover:text-gray-900">
                Features
              </a>
            </nav>
          </div>
          <div className="inline-flex items-center ml-5 space-x-6 lg:justify-end">
            <button
              type="button"
              className="text-base font-medium leading-6 text-gray-600 hover:text-gray-900 bg-transparent border-none p-0 cursor-pointer"
            >
              Sign in
            </button>
            <button
              type="button"
              className="px-4 py-2 text-base font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500"
            >
              Sign up
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="px-2 py-32 bg-white md:px-0">
        <div className="container flex flex-wrap items-center max-w-6xl px-8 mx-auto">
          <div className="w-full md:w-1/2">
            <h1 className="text-5xl font-extrabold text-gray-900">
              <span className="block">Empowering You to Create</span>
              <span className="block text-indigo-600">Realistic Deepfake Content.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500">
              Experience the latest advancements in deepfake technology and unleash your creativity.
            </p>
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-6 py-3 text-lg text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Upload Video
              </button>
              <a
                href="#learnmore"
                className="px-6 py-3 text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 mt-10 md:mt-0">
            <img
              src="https://lawtrend.in/wp-content/uploads/2023/11/ai-deep-fake.jpeg"
              alt="Deepfake example"
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white p-6 rounded shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold text-black mb-6">Upload a Video for Deepfake Detection</h1>
            <form onSubmit={handleUpload}>
              <input type="file" accept="video/*" onChange={handleFileChange} className="mb-4" />
              {videoPreview && (
                <video src={videoPreview} controls className="w-full mb-4 rounded"></video>
              )}
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Upload
              </button>
            </form>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
