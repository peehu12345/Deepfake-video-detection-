import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {loginServices} from "../api"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function Login() {
  const location = useLocation();
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const methods = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Reset form when switching between login/register modes to clear fields
  useEffect(() => {
    methods.reset({
      name: '',
      email: '',
      password: '',
    });
  }, [isRegister, methods]);

  const onSubmit = async (data) => {
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    const url = isRegister ? 'http://localhost:8000/register' : null;
    const body = isRegister ? { name: data.name, email: data.email, password: data.password } : { email: data.email, password: data.password };
    let response;
    try {
      if (isRegister) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Registration failed');
        }
        alert("Account created successfully! Please sign in.");
        setIsRegister(false);
        methods.reset();
      } else {
        response = await loginServices(body);
        // Assuming loginServices throws on error; if it returns a response, adjust accordingly
        navigate('/upload');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="A_cinematic_3d_202509101317.mp4" // Replace with your video path or URL
      >
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/30" /> {/* Optional overlay for better readability */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            {isRegister ? 'Create an account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-200 drop-shadow-lg">
            {isRegister ? 'Join us today and get started' : 'Welcome back, please sign in'}
          </p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl p-8 border border-white/20">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              {isRegister && (
                <FormField
                  control={methods.control}
                  name="name"
                  rules={{ 
                    required: "Name is required.",
                    minLength: { value: 2, message: "Name must be at least 2 characters." }
                  }}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          autoComplete="off"
                          className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={methods.control}
                name="email"
                rules={{ 
                  required: "Email is required.",
                  pattern: {
                    value: /^[^\s@]+@(gmail|yahoo)\.com$/i,
                    message: "Please enter a valid email address (e.g., Gmail or Yahoo)."
                  }
                }}
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email" 
                        type="email"
                        autoComplete="off"
                        className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="password"
                rules={{ 
                  required: "Password is required.",
                  minLength: { value: 8, message: "Password must be at least 8 characters." }
                }}
                render={({ field }) => (
                  <FormItem className="space-y-2" style={{ marginBottom: '1rem', marginTop: '1rem'}}>
                    <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your password" 
                        type="password"
                        autoComplete="new-password"
                        className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                loading={isLoading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                disabled={!methods.formState.isValid}
              >
                {isRegister ? (isLoading ? 'Creating Account...' : 'Create Account') : (isLoading ? 'Signing In...' : 'Sign In')}
              </Button>
            </form>
          </Form>
         <div className="text-center mt-10 pt-4 border-t border-gray-200">
  <Button
    type="button"
    variant="ghost"
    onClick={() => setIsRegister(!isRegister)}
    className="w-full justify-center text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors rounded-md"
    disabled={isLoading}
  >
    {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
  </Button>
</div>
        </div>
      </div>
    </div>
  );
}

export default Login;