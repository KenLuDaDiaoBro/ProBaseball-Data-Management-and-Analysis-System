import { useState } from "react";
import MatchupTable from "../components/MatchupTable";

function MatchUp() {
  const [pitcherId, setPitcherId] = useState("");
  const [batterId, setBatterId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pitcherId && batterId) {
      setSubmitted(true);
    } else {
      alert("Please enter both pitcher and batter IDs.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pitcher vs Batter Matchup</h1>

      <form onSubmit={handleSubmit} className="mb-4 space-x-2">
        <input
          type="text"
          placeholder="Pitcher ID"
          value={pitcherId}
          onChange={(e) => setPitcherId(e.target.value)}
          className="border px-2 py-1"
        />
        <input
          type="text"
          placeholder="Batter ID"
          value={batterId}
          onChange={(e) => setBatterId(e.target.value)}
          className="border px-2 py-1"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      {submitted && pitcherId && batterId ? (
        <MatchupTable pitcherId={pitcherId} batterId={batterId} />
      ) : (
        <p className="text-gray-500">Please enter IDs and submit to view matchup.</p>
      )}
    </div>
  );
}

export default MatchUp;
