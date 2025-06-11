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
  ST: "Sweeper",
  UN: "Unknown",
};

const pitchTypeColors = {
  "Four-Seam Fastball": '#FF6384', // 紅色
  "Curveball": '#FFCE56',          // 黃色
  "Slider": '#36A2EB',             // 藍色
  "Changeup": '#8BC34A',           // 綠色
  "Sweeper": '#1E3A8A',            // 深藍色
  "Two-Seam Fastball": '#FF9800',  // 橙色
  "Sinker": '#9C27B0',             // 紫色
  "Cutter": '#00BCD4',             // 青色
  "Splitter": '#E91E63',           // 粉紅色
  "Knuckle Curve": '#795548',      // 棕色
  "Screwball": '#607D8B',          // 灰藍色
  "Knuckleball": '#FF5733',        // 深橙色
  "Eephus": '#C70039',             // 深紅色
  "Forkball": '#900C3F',           // 深紫色
  "Pitch Out": '#581845',          // 暗紫色
  "Intentional Ball": '#2ECC71',   // 亮綠色
  "Unknown": '#95A5A6',            // 灰色
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

  // 根據球種動態生成顏色
  const backgroundColors = labels.map(label => pitchTypeColors[label] || pitchTypeColors['Unknown']);

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
        display: false,
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

  const CustomLegend = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
      {chartData.labels.map((label, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: chartData.datasets[0].backgroundColor[index],
              marginRight: '10px',
              border: '1px solid #fff',
            }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ minWidth: 200, minHeight: 200, textAlign: 'center' }}>
        <Pie data={chartData} options={options} />
        <p style={{ textAlign: 'center', marginTop: '20px' }}>Total: {totalCount}</p>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <CustomLegend />
      </div>
    </div>
  );
};

export default PitchTypePieChart;