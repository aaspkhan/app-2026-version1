import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Utensils, CheckCircle, AlertCircle } from 'lucide-react';
import { analyzeFood } from '../services/geminiService';
import { FoodAnalysisResult } from '../types';

export const FoodScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processImage(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Data: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await analyzeFood(base64Data);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/20 rounded-full">
            <Utensils className="w-6 h-6 text-purple-400" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-white">AI Food Scanner</h3>
            <p className="text-sm text-slate-400">Estimate Glycemic Load via Camera</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-slate-800/50 transition-colors h-80 relative overflow-hidden ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
        >
          {image ? (
            <img src={image} alt="Food" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
             <div className="text-center">
                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-300">Tap to take photo</p>
             </div>
          )}
          <input 
             ref={fileInputRef}
             type="file" 
             accept="image/*" 
             capture="environment"
             className="hidden" 
             onChange={handleCapture}
             disabled={loading}
          />
          
          {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                <span className="text-xs text-purple-200 font-medium animate-pulse">Scanning Image...</span>
             </div>
          )}
        </div>

        {/* Results */}
        <div className="flex flex-col h-80 bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 overflow-y-auto relative">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
                    <Utensils className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Analyzing nutrients...</p>
                    <p className="text-xs text-slate-500 mt-2">Connecting to Gemini AI</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="text-red-400 font-bold mb-1">Analysis Error</p>
                    <p className="text-sm text-slate-400 mb-4">{error}</p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : result ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-700 pb-4">
                        <h4 className="text-2xl font-bold text-white leading-tight">{result.foodName}</h4>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mt-3 uppercase tracking-wide ${
                            result.riskColor === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            result.riskColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                result.riskColor === 'green' ? 'bg-green-400' :
                                result.riskColor === 'yellow' ? 'bg-yellow-400' :
                                'bg-red-400'
                            }`} />
                            Glycemic Risk: {result.riskColor}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Glycemic Load</span>
                            <p className="text-2xl font-bold text-white">{result.glycemicLoad}</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Carbs</span>
                            <p className="text-2xl font-bold text-white">{result.carbs}<span className="text-sm text-slate-400 ml-1">g</span></p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-sm text-slate-300 italic leading-relaxed">"{result.analysis}"</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                    <Camera className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Upload a meal photo to view<br/>carbs and glycemic analysis.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};