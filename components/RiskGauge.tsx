import React from 'react';

interface RiskGaugeProps {
  score: number; // 0-100
  level: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  // Calculate dash offset for SVG circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  let color = '#22c55e'; // Green
  if (score > 30) color = '#eab308'; // Yellow
  if (score > 60) color = '#f97316'; // Orange
  if (score > 80) color = '#ef4444'; // Red

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#334155"
          strokeWidth="10"
          fill="transparent"
          className="w-full h-full"
        />
        {/* Progress Circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Risk Score</span>
        <span className="text-sm font-medium mt-1" style={{ color }}>{level}</span>
      </div>
    </div>
  );
};