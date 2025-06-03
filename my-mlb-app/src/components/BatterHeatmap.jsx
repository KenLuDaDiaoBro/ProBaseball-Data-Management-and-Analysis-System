import React from 'react';

function BatterHeatMap({player}) {
  const CELL = 40;
  const layout = [
    'AAAABBBB',
    'AEEFFGGB',
    'AEEFFGGB',
    'AHHIIJJB',
    'CHHIIJJD',
    'CKKLLMMD',
    'CKKLLMMD',
    'CCCCDDDD',
  ];
  const ROWS = layout.length;
  const COLS = layout[0].length;
  const WIDTH = COLS * CELL;
  const HEIGHT = ROWS * CELL + 50;

  const zoneMap = {
    A: player.AVGZLU,
    B: player.AVGZRU,
    C: player.AVGZLD,
    D: player.AVGZRD,
    E: player.AVGZ1,
    F: player.AVGZ2,
    G: player.AVGZ3,
    H: player.AVGZ4,
    I: player.AVGZ5,
    J: player.AVGZ6,
    K: player.AVGZ7,
    L: player.AVGZ8,
    M: player.AVGZ9,
  };

  const heatmapData = layout.map(row =>
    row.split('').map(key => zoneMap[key] || 0)
  );

  const colorScale = (v) => {
    if (v >= 0.4) return "#EA0000";
    if (v >= 0.3) return "#FF9797";
    if (v >= 0.2) return "#F0F0F0";
    if (v >= 0.1) return "#ACD6FF";
    return "#4575B4";
  };

  const textColor = (v) => ((v >= 0.1 && v < 0.4) ? "#000" : "#fff");

  // 1. 建立 zone -> 所有座標清單
  const zoneToCells = {};
  layout.forEach((row, ri) => {
    row.split('').forEach((zoneKey, ci) => {
      if (!zoneToCells[zoneKey]) zoneToCells[zoneKey] = [];
      zoneToCells[zoneKey].push([ri, ci]);
    });
  });

  // 2. 對每個 zone，計算幾何中心 (row, col)
  const zoneCenters = {};
  for (const zone in zoneToCells) {
    const coords = zoneToCells[zone];
    const avgRow = coords.reduce((sum, [r]) => sum + r + 0.5, 0) / coords.length;
    const avgCol = coords.reduce((sum, [, c]) => sum + c + 0.5, 0) / coords.length;
    zoneCenters[zone] = { x: avgCol * CELL, y: avgRow * CELL };
  }

  return (
    <div style={{ maxWidth: WIDTH, paddingTop: 10, textAlign: "center" }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: 'auto' }}>
        {/* 3. 畫每一格的底色與邊線 */}
        {layout.map((rowKeys, ri) =>
          rowKeys.split('').map((zoneKey, ci) => {
            const x = ci * CELL;
            const y = ri * CELL;
            const v = parseFloat(heatmapData[ri]?.[ci]) || 0;

            const leftKey   = ci > 0 ? layout[ri][ci - 1] : null;
            const rightKey  = ci < COLS - 1 ? layout[ri][ci + 1] : null;
            const topKey    = ri > 0 ? layout[ri - 1][ci] : null;
            const bottomKey = ri < ROWS - 1 ? layout[ri + 1][ci] : null;

            const strokeLines = [];
            if (topKey !== zoneKey)    strokeLines.push(<line key="t" x1={x} y1={y} x2={x + CELL} y2={y} stroke="#222" strokeWidth="1" />);
            if (leftKey !== zoneKey)   strokeLines.push(<line key="l" x1={x} y1={y} x2={x} y2={y + CELL} stroke="#222" strokeWidth="1" />);
            if (rightKey !== zoneKey)  strokeLines.push(<line key="r" x1={x + CELL} y1={y} x2={x + CELL} y2={y + CELL} stroke="#222" strokeWidth="1" />);
            if (bottomKey !== zoneKey) strokeLines.push(<line key="b" x1={x} y1={y + CELL} x2={x + CELL} y2={y + CELL} stroke="#222" strokeWidth="1" />);

            return (
              <g key={`${ri}-${ci}`}>
                <rect
                  x={x - 0.5}
                  y={y - 0.5}
                  width={CELL + 1}
                  height={CELL + 1}
                  fill={colorScale(v)}
                  shapeRendering="crispEdges"
                />
                {strokeLines}
              </g>
            );
          })
        )}

        {Object.entries(zoneCenters).map(([zoneKey, { x, y }]) => {
          const [sampleR, sampleC] = zoneToCells[zoneKey][0];
          const v = parseFloat(heatmapData[sampleR]?.[sampleC]) || 0;

          let anchor = "middle";
          let dx = 0;
          let dy = 4;

          // 左上角 (zone A)
          if (zoneKey === 'A') {
            anchor = "start";
            dx = -30;
            dy = -30;
          }
          // 右上角 (zone B)
          else if (zoneKey === 'B') {
            anchor = "end";
            dx = 30;
            dy = -30;
          }
          // 左下角 (zone C)
          else if (zoneKey === 'C') {
            anchor = "start";
            dx = -30;
            dy = 38;
          }
          // 右下角 (zone D)
          else if (zoneKey === 'D') {
            anchor = "end";
            dx = 30;
            dy = 38;
          }

          return (
            <text
              key={zoneKey}
              x={x + dx}
              y={y + dy}
              textAnchor={anchor}
              fill={textColor(v)}
              fontSize={['E','F','G','H','I','J','K','L','M'].includes(zoneKey) ? 14 : 12}
              fontWeight="bold"
              pointerEvents="none"
            >
              {v.toFixed(3)}
            </text>
          );
        })}

        <polygon
        points={`
            ${(COLS / 2 - 2.5) * CELL},${ROWS * CELL + 10}
            ${(COLS / 2 + 2.5) * CELL},${ROWS * CELL + 10}
            ${(COLS / 2 + 3) * CELL},${ROWS * CELL + 25}
            ${(COLS / 2) * CELL},${ROWS * CELL + 50}
            ${(COLS / 2 - 3) * CELL},${ROWS * CELL + 25}
        `}
        fill="#eee"
        stroke="#222"
        strokeWidth="1"/>
      </svg>
    </div>
  );
}

export default BatterHeatMap;