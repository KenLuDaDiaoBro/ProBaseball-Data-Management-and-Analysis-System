import { Link } from "react-router-dom";
import { useState } from "react";

function Home() {
  const [isMatchUpOpen, setIsMatchUpOpen] = useState(false);

  const toggleMatchUp = () => {
    setIsMatchUpOpen(!isMatchUpOpen);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to MLB Player Search</h1>

      <div className="home-buttons" style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/search">
          <button className="home-nav-button">Search</button>
        </Link>

        <Link to="/leaderboard">
          <button className="home-nav-button">Leaderboard</button>
        </Link>

        <button
          className="home-nav-button"
          onClick={toggleMatchUp}
        >
          Match Up
        </button>
      </div>
      <div className={`home-sub-buttons ${isMatchUpOpen ? 'open' : ''}`}>
          <Link to="/matchup">
            <button className="home-sub-button">BVP</button>
          </Link>
          <Link to="/Compare">
            <button className="home-sub-button">PVP</button>
          </Link>
          <Link to="/Compare">
            <button className="home-sub-button">BVB</button>
          </Link>
        </div>
    </div>
  );
}

export default Home;