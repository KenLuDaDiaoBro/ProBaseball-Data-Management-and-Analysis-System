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
  const pitchCount = {};

  pitchData.forEach(p => {
    const type = pitchTypeMap[p.pitch_type] || p.pitch_type || 'Unknown';
    pitchCount[type] = (pitchCount[type] || 0) + 1;
  });

  const sortedPitchCount = Object.entries(pitchCount).sort((a, b) => b[1] - a[1]);

  const labels = sortedPitchCount.map(([type]) => type);
  const counts = sortedPitchCount.map(([, count]) => count);

  const totalCount = counts.reduce((sum, count) => sum + count, 0);

  const percentages = counts.map(count => totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0);
  const displayLabels = labels.map((label, index) => `${label} (${percentages[index]}%)`);

  const backgroundColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#FF9800',
    '#9C27B0', '#00BCD4', '#E91E63', '#795548', '#607D8B'
  ];

  const chartData = {
    labels: displayLabels,
    datasets: [
      {
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      datalabels: {
        display: false, // Disable data labels on the chart
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label.split(' (')[0] || '';
            const value = context.raw || 0;
            return `${label} total usage: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ minWidth: 350, minHeight: 500, textAlign: 'center'}}>
      <Pie data={chartData} options={options} />
      <p style={{ textAlign: 'center', marginTop: '20px' }}>Total Pitch: {totalCount}</p>
    </div>
  );
};

export default PitchTypePieChart;