import { useEffect, useState } from "react";

function MatchupTable({ pitcherId, batterId }) {
  const [matchupData, setMatchupData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchupData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `http://localhost:5000/api/matchup?pitcher=${pitcherId}&batter=${batterId}`
        );
        if (!response.ok) throw new Error("Failed to fetch matchup data");
        const data = await response.json();
        setMatchupData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchupData();
  }, [pitcherId, batterId]);

  if (loading) return <p>Loading matchup data...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!matchupData || matchupData.length === 0)
    return <p>No data found for this matchup.</p>;

  return (
    <table className="table-auto border border-collapse mt-4">
      <thead>
        <tr>
          <th className="border px-4 py-2">Date</th>
          <th className="border px-4 py-2">Result</th>
          <th className="border px-4 py-2">Pitch Type</th>
          <th className="border px-4 py-2">Speed</th>
          <th className="border px-4 py-2">Zone</th>
        </tr>
      </thead>
      <tbody>
        {matchupData.map((entry, index) => (
          <tr key={index}>
            <td className="border px-4 py-2">{entry.date}</td>
            <td className="border px-4 py-2">{entry.result}</td>
            <td className="border px-4 py-2">{entry.pitch_type}</td>
            <td className="border px-4 py-2">{entry.speed}</td>
            <td className="border px-4 py-2">{entry.zone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default MatchupTable;
