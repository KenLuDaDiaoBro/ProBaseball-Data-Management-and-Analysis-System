import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import PlayerSearch from "./pages/PlayerSearch";
import PlayerDetail from "./pages/PlayerDetail";
import TeamDetail from "./pages/TeamDetail";
import LeaderBoard from "./pages/LeaderBoard";
import LeaderBoardDetail from "./pages/LeaderBoardDetail";
import MatchUp from "./pages/MatchUp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<PlayerSearch />} />
        <Route path="/playerDetail/:id" element={<PlayerDetail />} />
        <Route path="/team/:code" element={<TeamDetail />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
        <Route path="/LeaderBoardDetail" element={<LeaderBoardDetail />} />
        <Route path="/MatchUp" element={<MatchUp />} />
      </Routes>
    </Router>
  );
}

export default App;