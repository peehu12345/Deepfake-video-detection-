import { Facebook, Twitter, Instagram, Linkedin, Github, Mic, Video, Image as ImageIcon, Code, Shield, HelpCircle, BookOpen, User, Briefcase, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#12141C] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              DeepFake<span className="text-crypto-purple">Detector</span>
            </h2>
            <p className="text-gray-400 mb-6 max-w-xs">
              The most trusted deepfake detection platform, empowering users with innovative tools to verify audio, video, and images with unparalleled accuracy.
            </p>
            <div className="flex space-x-4">
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <a
                  className="text-gray-400 hover:text-crypto-purple transition-colors cursor-pointer flex items-center gap-2"
                  onClick={() => navigate('/audioanalysis')}
                >
                  <Mic size={16} /> Audio Analysis
                </a>
              </li>
              <li>
                <a
                  className="text-gray-400 hover:text-crypto-purple transition-colors cursor-pointer flex items-center gap-2"
                  onClick={() => navigate('/upload')}
                >
                  <Video size={16} /> Video Verification
                </a>
              </li>
              <li>
                <a
                  className="text-gray-400 hover:text-crypto-purple transition-colors cursor-pointer flex items-center gap-2"
                  onClick={() => navigate('/imageupload')}
                >
                  <ImageIcon size={16} /> Image Detection
                </a>
              </li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Code size={16}/> API Access</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Shield size={16}/> Enterprise Solutions</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><BookOpen size={16} /> Blog</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Video size={16} /> Tutorials</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Shield size={16} /> Deepfake Insights</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Code size={16} /> Documentation</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><HelpCircle size={16} /> Help Center</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><User size={16} /> About Us</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Briefcase size={16} /> Careers</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><BookOpen size={16} /> Press</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Info size={16} /> Legal & Privacy</a></li>
              <li><a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors flex items-center gap-2"><Mail size={16} /> Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6">
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Terms of Service</a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Privacy Policy</a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;