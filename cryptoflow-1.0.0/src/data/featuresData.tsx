import React from 'react';
import { Activity, Lock, Zap, Compass, LineChart, Shield } from 'lucide-react';

export const features = [
  {
    icon: <Activity className="h-6 w-6" />,
    title: "Real-time Analysis",
    description: "Analyze audio, video, and images in real-time with advanced AI-powered detection tools."
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Bank-level Security",
    description: "Your media files are protected with military-grade encryption and secure upload protocols."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Fast Detection",
    description: "Detect deepfakes in seconds with our high-performance AI analysis engine."
  },
  {
    icon: <Compass className="h-6 w-6" />,
    title: "Smart Verification",
    description: "Get AI-driven authenticity scores and insights for audio, video, and image media."
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    title: "Confidence Metrics",
    description: "Receive detailed confidence scores and analytics to assess media authenticity."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Storage",
    description: "Uploaded media is securely stored with strict access controls for maximum privacy."
  }
];