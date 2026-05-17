import { Button } from '@/components/ui/button';
import { Menu, X, Home, Video, Image as ImageIcon, Mic, Star, Info, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('token');
   const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/upload');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-crypto-blue/80 backdrop-blur-md py-3 shadow-lg' : 'py-6'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">
            DeepFake<span className="text-crypto-purple">Detector</span>
          </h1>
        </div>

        {/* Desktop menu */}
        <ul className="hidden lg:flex items-center space-x-6">
          <li>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-crypto-purple hover:text-white transition-colors font-semibold">
              <LayoutDashboard size={18} /> History
            </Link>
          </li>
          <li>
            <Link to="/" className="flex items-center gap-1.5 text-gray-300 hover:text-crypto-purple transition-colors font-medium">
              <Home size={18} /> Home
            </Link>
          </li>
          <li>
            <Link to="/upload" className="flex items-center gap-1.5 text-gray-300 hover:text-crypto-purple transition-colors font-medium">
              <Video size={18} /> Video Scan
            </Link>
          </li>
          <li>
            <Link to="/imageupload" className="flex items-center gap-1.5 text-gray-300 hover:text-crypto-purple transition-colors font-medium">
              <ImageIcon size={18} /> Image Scan
            </Link>
          </li>
          <li>
            <a href="#features" className="flex items-center gap-1.5 text-gray-300 hover:text-crypto-purple transition-colors font-medium">
              <Star size={18} /> Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="flex items-center gap-1.5 text-gray-300 hover:text-crypto-purple transition-colors font-medium">
              <Info size={18} /> About
            </a>
          </li>
        </ul>

        <div className="hidden lg:flex items-center space-x-4" >
{isLoggedIn ? (
  <>
 
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full px-4 py-2 rounded font-medium"
      >
        Logout
      </Button>
   
  </>
) : (
  <Button asChild variant="ghost" size="sm">
    <Link to="/login" className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full px-4 py-2 rounded font-medium">
      Login
    </Link>
  </Button>
)}
{/*<Button
  onClick={handleGetStarted}
  className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full px-4 py-2 rounded font-medium"
>
  Get Started
</Button>*/}
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-crypto-blue/95 backdrop-blur-lg absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link to="/dashboard" className="flex items-center gap-2 text-crypto-purple hover:text-white transition-colors py-2 -ml-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                  <LayoutDashboard size={18} /> History
                </Link>
              </li>
              <li>
                <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 -ml-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Home size={18} /> Home
                </Link>
              </li>
              <li>
                <Link to="/upload" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 -ml-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Video size={18} /> Video Scan
                </Link>
              </li>
              <li>
                <Link to="/imageupload" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 -ml-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <ImageIcon size={18} /> Image Scan
                </Link>
              </li>
              <li>
                <a href="#features" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 -ml-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Star size={18} /> Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2 -ml-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Info size={18} /> About us
                </a>
              </li>
              <li className="pt-4 flex flex-col space-y-3">
                {isLoggedIn ? (
                  <Button
                    variant="ghost"
                    className="text-red-500 w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Login
                  </Button>
                )}
                <button
                  className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleGetStarted();
                  }}
                >
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;