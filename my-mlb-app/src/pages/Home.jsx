import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <h1 className="title">Welcome to MLB Player Search</h1>

      <Link to="/search">
        <button className="nav-button">Go to Search</button>
      </Link>
    </div>
  );
}

export default Home;