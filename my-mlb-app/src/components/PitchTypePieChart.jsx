import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const pitchTypeMap = {
  FF: "Four-Seam Fastball",
  FT: "Two-Seam Fastball",
  SI: "Sinker",
  FC: "Cutter",
  FS: "Splitter",
  SL: "Slider",
  CU: "Curveball",
  KC: "Knuckle Curve",
  CH: "Changeup",
  SC: "Screwball",
  KN: "Knuckleball",
  EP: "Eephus",
  FO: "Forkball",
  PO: "Pitch Out",
  IN: "Intentional Ball",
  UN: "Unknown",
};

const PitchTypePieChart = ({ pitchData }) => {
  // 統計球種出現次數
  const pitchCount = {};

  pitchData.forEach(p => {
    const type = pitchTypeMap[p.pitch_type] || p.pitch_type || 'Unknown';
    pitchCount[type] = (pitchCount[type] || 0) + 1;
  });

  const sortedPitchCount = Object.entries(pitchCount).sort((a, b) => b[1] - a[1]);

  const labels = sortedPitchCount.map(([type]) => type);
  const counts = sortedPitchCount.map(([, count]) => count);

  const totalCount = counts.reduce((sum, count) => sum + count, 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pitch Type Usage',
        data: counts,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#FF9800',
          '#9C27B0', '#00BCD4', '#E91E63', '#795548', '#607D8B'
        ],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || 'Unknown';
            const value = context.raw || 0;
            const percentage = totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto'}}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PitchTypePieChart;
