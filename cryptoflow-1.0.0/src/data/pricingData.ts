export const pricingPlans = [
  {
    name: "Basic",
    price: { monthly: "$0", annual: "$0" },
    description: "Perfect for individuals starting with deepfake detection.",
    features: [
      "Analyze up to 5 media files per month",
      "Basic audio and image detection",
      "Standard support",
      "Access to community forums"
    ],
    buttonText: "Get Started",
  },
  {
    name: "Pro",
    price: { monthly: "$29", annual: "$23" },
    description: "Ideal for professionals needing advanced analysis tools.",
    features: [
      "Analyze up to 50 media files per month",
      "Advanced audio, video, and image detection",
      "Priority support",
      "Detailed analysis reports",
      "API access"
    ],
    highlighted: true,
    buttonText: "Start Pro Plan",
  },
  {
    name: "Enterprise",
    price: { monthly: "Custom", annual: "Custom" },
    description: "Tailored for businesses with high-volume detection needs.",
    features: [
      "Unlimited media file analysis",
      "Full audio, video, and image detection",
      "Dedicated support",
      "Custom reporting and integrations",
      "API access with higher limits"
    ],
    buttonText: "Contact Sales",
  },
];