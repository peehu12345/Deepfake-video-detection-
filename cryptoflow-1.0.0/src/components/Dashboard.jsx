import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Activity, FileVideo, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('scanHistory') || '[]');
      setHistory(data);
    } catch(e) {
      setHistory([]);
    }
  }, []);

  const clearHistory = () => {
    if(window.confirm("Are you sure you want to clear your scanning history?")) {
      localStorage.removeItem('scanHistory');
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(item => 
    item.fileName?.toLowerCase().includes(search.toLowerCase()) || 
    item.overallPrediction?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-crypto-purple to-crypto-blue bg-clip-text text-transparent">
              Recent Scans Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Track and analyze your deepfake detection history.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search history..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-crypto-purple focus:border-transparent outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">Total Scans</h3>
              <div className="p-3 bg-crypto-purple/20 rounded-full"><Activity className="text-crypto-purple h-6 w-6" /></div>
            </div>
            <p className="text-4xl font-bold text-white">{history.length}</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">Fakes Detected</h3>
              <div className="p-3 bg-red-500/20 rounded-full"><ShieldAlert className="text-red-400 h-6 w-6" /></div>
            </div>
            <p className="text-4xl font-bold text-red-400">
              {history.filter(h => h.overallPrediction?.toLowerCase() === 'fake').length}
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">Authentic Media</h3>
              <div className="p-3 bg-green-500/20 rounded-full"><CheckCircle className="text-green-400 h-6 w-6" /></div>
            </div>
            <p className="text-4xl font-bold text-green-400">
              {history.filter(h => h.overallPrediction?.toLowerCase() === 'real').length}
            </p>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Scan Log</h2>
            {history.length > 0 && (
              <Button variant="ghost" onClick={clearHistory} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                Clear History
              </Button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {filteredHistory.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-400 text-sm border-b border-gray-700/50">
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Result</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Confidence Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredHistory.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileVideo className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium text-gray-200">{scan.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {scan.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          scan.overallPrediction?.toLowerCase() === 'real' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {scan.overallPrediction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-gray-300 font-medium">{(scan.confidence * 100).toFixed(1)}%</span>
                          {/* Mini progress bar */}
                          <div className="ml-4 w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${scan.overallPrediction?.toLowerCase() === 'fake' ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${scan.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <Search className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-300">No scans found</h3>
                <p className="text-gray-500 mt-2">Upload and scan videos to see your history here.</p>
                <div className="mt-6">
                  <Link to="/upload" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crypto-purple hover:bg-crypto-dark-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crypto-purple">
                    Start a New Scan
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
