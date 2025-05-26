import { useState, useEffect } from "react";

function MatchUp() {
  const [players, setPlayers] = useState([]);
  const [pitchers, setPitchers] = useState([]);
  const [batters, setBatters] = useState([]);

  const [pitcherInput, setPitcherInput] = useState("");
  const [batterInput, setBatterInput] = useState("");
  const [filteredPitchers, setFilteredPitchers] = useState([]);
  const [filteredBatters, setFilteredBatters] = useState([]);
  const [selectedPitcherId, setSelectedPitcherId] = useState(null);
  const [selectedBatterId, setSelectedBatterId] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // 載入球員資料
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/players")
      .then(res => res.json())
      .then(data => {
        setPlayers(data);
        setPitchers(data.filter(p => p.Type === "Pitcher"));
        setBatters(data.filter(p => p.Type !== "Pitcher"));
      })
      .catch(err => console.error("Error fetching players:", err));
  }, []);

  // 推薦名單 - 投手
  useEffect(() => {
    const term = pitcherInput.trim().toLowerCase();
    if (!term) return setFilteredPitchers([]);
    const matches = pitchers
      .map(p => {
        const name = p.Name.toLowerCase();
        let score = name.startsWith(term) ? 2 : name.includes(term) ? 1 : 0;
        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score || a.Name.localeCompare(b.Name))
      .slice(0, 5);
    setFilteredPitchers(matches);
  }, [pitcherInput, pitchers]);

  // 推薦名單 - 打者
  useEffect(() => {
    const term = batterInput.trim().toLowerCase();
    if (!term) return setFilteredBatters([]);
    const matches = batters
      .map(b => {
        const name = b.Name.toLowerCase();
        let score = name.startsWith(term) ? 2 : name.includes(term) ? 1 : 0;
        return { ...b, score };
      })
      .filter(b => b.score > 0)
      .sort((a, b) => b.score - a.score || a.Name.localeCompare(b.Name))
      .slice(0, 5);
    setFilteredBatters(matches);
  }, [batterInput, batters]);

  // 送出查詢
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPitcherId || !selectedBatterId) {
      setError("Please select both a pitcher and a batter.");
      return;
    }

    setLoading(true);
    setError("");
    setData([]);
    setSubmitted(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/matchup?pitcher=${selectedPitcherId}&batter=${selectedBatterId}`
      );
      const text = await res.text();
      const result = JSON.parse(text);
      if (res.ok) setData(result);
      else setError(result.error || "Unknown error");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch matchup data.");
    } finally {
      setLoading(false);
    }
  };

  // 計算統計
  const calculateStats = (data) => {
    const stats = {
      PA: data.length,
      AB: 0,
      H: 0,
      '2B': 0,
      '3B': 0,
      HR: 0,
      BB: 0,
      HBP: 0,
      SO: 0,
      AVG: 0.0,
      OBP: 0.0,
      SLG: 0.0,
      OPS: 0.0,
    };
    data.forEach((item) => {
      const event = item.events;
      if (event === 'walk' || event === 'intent_walk') stats.BB++;
      else if (event === 'hit_by_pitch') stats.HBP++;
      else if (event === 'sac_fly' || event === 'sac_bunt') return;
      else {
        stats.AB++;
        if (event === 'single') stats.H++;
        else if (event === 'double') { stats.H++; stats['2B']++; }
        else if (event === 'triple') { stats.H++; stats['3B']++; }
        else if (event === 'home_run') { stats.H++; stats.HR++; }
        else if (event === 'strikeout') stats.SO++;
      }
    });
    stats.AVG = stats.AB > 0 ? (stats.H / stats.AB).toFixed(3) : 0.0;
    stats.OBP = stats.PA > 0 ? ((stats.H + stats.BB + stats.HBP) / stats.PA).toFixed(3) : 0.0;
    stats.SLG = stats.AB > 0 ? ((stats.H + stats['2B'] * 2 + stats['3B'] * 3 + stats.HR * 4) / stats.AB).toFixed(3) : 0.0;
    stats.OPS = (parseFloat(stats.OBP) + parseFloat(stats.SLG)).toFixed(3);
    return stats;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pitcher vs Batter Matchup</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {/* 投手欄位 */}
        <div>
          <input
            type="text"
            placeholder="Pitcher Name"
            value={pitcherInput}
            onChange={(e) => {
              setPitcherInput(e.target.value);
              setSelectedPitcherId(null);
            }}
            className="border px-2 py-1 w-full"
          />
          {filteredPitchers.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1">
              {filteredPitchers.map(p => (
                <li
                  key={p.id}
                  className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setPitcherInput(p.Name);
                    setSelectedPitcherId(p.id);
                    setFilteredPitchers([]);
                  }}
                >
                  {p.Name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 打者欄位 */}
        <div>
          <input
            type="text"
            placeholder="Batter Name"
            value={batterInput}
            onChange={(e) => {
              setBatterInput(e.target.value);
              setSelectedBatterId(null);
            }}
            className="border px-2 py-1 w-full"
          />
          {filteredBatters.length > 0 && (
            <ul className="border border-gray-300 rounded bg-white mt-1">
              {filteredBatters.map(b => (
                <li
                  key={b.id}
                  className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setBatterInput(b.Name);
                    setSelectedBatterId(b.id);
                    setFilteredBatters([]);
                  }}
                >
                  {b.Name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {submitted && !loading && data.length === 0 && !error && <p>No matchup data found.</p>}

      {/* 對戰明細 */}
      {data.length > 0 && (
        <>
          <table className="table-auto border border-collapse border-gray-400 w-full text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Game Date</th>
                <th className="border px-2 py-1">Pitch Type</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Release Speed</th>
                <th className="border px-2 py-1">Zone</th>
                <th className="border px-2 py-1">Events</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{row.game_date}</td>
                  <td className="border px-2 py-1">{row.pitch_type}</td>
                  <td className="border px-2 py-1">{row.description}</td>
                  <td className="border px-2 py-1">{row.release_speed}</td>
                  <td className="border px-2 py-1">{row.zone}</td>
                  <td className="border px-2 py-1">{row.events}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 統計表 */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Matchup Statistics</h2>
            <table className="table-auto border border-collapse border-gray-400 w-full text-sm">
              <thead>
                <tr className="bg-gray-200">
                  {["PA", "AB", "H", "2B", "3B", "HR", "BB", "HBP", "SO", "AVG", "OBP", "SLG", "OPS"].map(col => (
                    <th key={col} className="border px-2 py-1">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.values(calculateStats(data)).map((val, idx) => (
                    <td key={idx} className="border px-2 py-1">{val}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default MatchUp;
