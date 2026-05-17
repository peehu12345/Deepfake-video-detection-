import React from "react";
import { Upload, Brain, CheckCircle } from "lucide-react";

export const steps = [
    {
      number: "01",
      icon: <Upload className="h-6 w-6" />,
      title: "Upload Your Media",
      description: "Easily upload your audio, video, or image files through our simple and secure interface."
    },
    {
      number: "02",
      icon: <Brain className="h-6 w-6" />,
      title: "Analyze with AI",
      description: "Our advanced AI algorithms process your media to detect deepfakes with high accuracy."
    },
    {
      number: "03",
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Review Results",
      description: "Get detailed reports and confidence scores to verify the authenticity of your media."
    }
];