import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import PlayerSearch from "./pages/PlayerSearch"; // 搜尋球員頁面
import PlayerDetail from "./pages/PlayerDetail"; // 球員詳情頁面
import TeamDetail from "./pages/TeamDetail";
import LeaderBoard from "./pages/LeaderBoard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<PlayerSearch />} />
        <Route path="/playerDetail/:id" element={<PlayerDetail />} />
        <Route path="/team/:code" element={<TeamDetail />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
      </Routes>
    </Router>
  );
}

export default App;