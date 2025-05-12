import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_OPTIONS = [
  { value: 'batter', label: 'Batter' },
  { value: 'pitcher', label: 'Pitcher' },
  { value: 'team', label: 'Team' },
];

const COLUMNS = {
  batter: [
    { key: 'Name',  label: 'Name'   },
    { key: 'Team',  label: 'Team'   },
    { key: 'PA',    label: 'PA'     },
    { key: 'AB',    label: 'AB'     },
    { key: 'H',     label: 'H'      },
    { key: 'H2',    label: '2B'     },
    { key: 'H3',    label: '3B'     },
    { key: 'HR',    label: 'HR'     },
    { key: 'RBI',   label: 'RBI'    },
    { key: 'SO',    label: 'SO'     },
    { key: 'BB',    label: 'BB'     },
    { key: 'SB',    label: 'SB'     },
    { key: 'CS',    label: 'CS'     },
    { key: 'AVG',   label: 'AVG'    },
    { key: 'OBP',   label: 'OBP'    },
    { key: 'SLG',   label: 'SLG'    },
    { key: 'OPS',   label: 'OPS'    },
    { key: 'Chase', label: 'Chase%' },
    { key: 'Whiff', label: 'Whiff%' },
    { key: 'GB',    label: 'GB%'    },
    { key: 'FB',    label: 'FB%'    },
    { key: 'GF',    label: 'G/F'    },
    { key: 'Sprint',label: 'Sprint' },
  ],
  pitcher: [
    { key: 'Name',  label: 'Name' },
    { key: 'Team',  label: 'Team' },
    { key: 'W',     label: 'W'    },
    { key: 'L',     label: 'L'    },
    { key: 'ERA',   label: 'ERA'  },
    { key: 'IP',    label: 'IP'   },
    { key: 'H',     label: 'H'    },
    { key: 'R',     label: 'R'    },
    { key: 'ER',    label: 'ER'   },
    { key: 'HR',    label: 'HR'   },
    { key: 'BB',    label: 'BB'   },
    { key: 'BB9',   label: 'BB/9' },
    { key: 'SO',    label: 'SO'   },
    { key: 'K9',    label: 'K/9'  },
    { key: 'WHIP',  label: 'WHIP' },
    { key: 'Chase', label: 'Chase%' },
    { key: 'Whiff', label: 'Whiff%' },
    { key: 'GB',    label: 'GB%'    },
    { key: 'FB',    label: 'FB%'    },
    { key: 'GF',    label: 'G/F'    },
  ],
  team: [
    { key: 'Team',    label: 'Team'    },
    { key: 'PA',      label: 'PA'      },
    { key: 'AB',      label: 'AB'      },
    { key: 'H',       label: 'H'       },
    { key: 'H2',      label: '2B'      },
    { key: 'H3',      label: '3B'      },
    { key: 'HR',      label: 'HR'      },
    { key: 'RBI',     label: 'RBI'     },
    { key: 'SO',      label: 'SO'      },
    { key: 'BB',      label: 'BB'      },
    { key: 'SB',      label: 'SB'      },
    { key: 'CS',      label: 'CS'      },
    { key: 'AVG',     label: 'AVG'     },
    { key: 'OPS',     label: 'OPS'     },
    { key: 'SLG',     label: 'SLG'     },
    { key: 'OBP',     label: 'OBP'     },
    { key: 'Chase',   label: 'Chase%'  },
    { key: 'Whiff',   label: 'Whiff%'  },
    { key: 'GB',      label: 'GB%'     },
    { key: 'FB',      label: 'FB%'     },
    { key: 'GF',      label: 'G/F'     },
    { key: 'W',       label: 'W'       },
    { key: 'L',       label: 'L'       },
    { key: 'ERA',     label: 'ERA'     },
    { key: 'IP',      label: 'IP'      },
    { key: 'PH',      label: 'P-H'      },
    { key: 'R',       label: 'R'       },
    { key: 'ER',      label: 'ER'      },
    { key: 'PHR',     label: 'P-HR'     },
    { key: 'PBB',     label: 'P-BB'     },
    { key: 'BB9',     label: 'BB/9'    },
    { key: 'PSO',     label: 'P-SO'     },
    { key: 'K9',      label: 'K/9'     },
    { key: 'WHIP',    label: 'WHIP'    },
    { key: 'PChase',  label: 'P-Chase%'  },
    { key: 'PWhiff',  label: 'P-Whiff%'  },
    { key: 'PGB',     label: 'P-GB%'     },
    { key: 'PFB',     label: 'P-FB%'     },
    { key: 'PGF',     label: 'P-G/F'     },
  ],
};

function LeaderBoardDetail() {
    const navigate = useNavigate();
    const [type,   setType]   = useState("batter");           // default
    const [year,   setYear]   = useState(2024);
    const [data,   setData]   = useState([]);
    const [loading, setLoading] = useState(false);

    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/players")
            .then(r => r.json())
            .then(setPlayers)
            .catch(console.error);

        fetch("http://127.0.0.1:5000/api/teams")
            .then(r => r.json())
            .then(setTeams)
            .catch(console.error);
    }, []);
    
    useEffect(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
        setFilteredOptions([]);
        return;
        }
    
        // 1. 球員打分
        const scoredPlayers = players
        .map((p) => {
            const name = p.Name.toLowerCase();
            let score = 0;
            if (name.startsWith(term)) score += 2;
            else if (name.includes(term)) score += 1;
            return { ...p, score, type: 'player' };
        })
        .filter((p) => p.score > 0);
    
        // 2. 球隊打分
        const scoredTeams = teams
        .map((t) => {
            const code = t.code.toLowerCase();
            let score = 0;
            if (code.startsWith(term)) score += 2;
            else if (code.includes(term)) score += 1;
            return { ...t, score, type: 'team' };
        })
        .filter((t) => t.score > 0);
    
        // 3. 合併、排序、取前 5
        const combined = [...scoredPlayers, ...scoredTeams]
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            // 同分就按名字/代號
            const aKey = a.type === 'player' ? a.Name : a.code;
            const bKey = b.type === 'player' ? b.Name : b.code;
            return aKey.localeCompare(bKey);
        })
        .slice(0, 5)
        .map(({ score, ...rest }) => rest);
    
        setFilteredOptions(combined);
    }, [searchTerm, players, teams]);
        
    const handleSelectOption = (opt) => {
        setSearchTerm("");
        setFilteredOptions([]);      // ← 這裡清空 filteredOptions
        if (opt.type === "player") {
        navigate(`/playerDetail/${opt.id}`);
        } else {
        navigate(`/team/${opt.code}`);
        }
    };

  // when year changes, fetch league stats
    useEffect(() => {
        setLoading(true);
        const endpoint =
        type === 'team'
            ? `http://127.0.0.1:5000/api/league_team_stats?year=${year}`
            : `http://127.0.0.1:5000/api/players_stats?year=${year}`;
        fetch(endpoint)
        .then(r => r.json())
        .then(json => setData(json))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [type, year]);

    const cols = COLUMNS[type];

    return (
        <div className="leaderboard-detail-container">
            <div className="fixed-header-bg" />
            <button className="back-button" onClick={()=>navigate(-1)}>←</button>
            <div className="home-image">
                <img
                className="home-icon"
                src="/home-icon.svg"
                alt="Home"
                onClick={() => navigate("/")}
                />
            </div>

            <div className="search-box">
                <input
                type="text"
                placeholder="Search for a player or a team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                />
                {filteredOptions.length > 0 && (
                <ul className="search-suggestions">
                    {filteredOptions.map((opt, i) => (
                    <li
                        key={i}
                        className="search-suggestion-item"
                        onClick={() => handleSelectOption(opt)}
                    >
                        {opt.type === "player" ? opt.Name : opt.code}
                    </li>
                    ))}
                </ul>
            )}
            </div>
            <h1 className="leaderboard-detail-title">Leaderboard Detail</h1>

            <div className="filters">
                <label>Type:
                    <select value={type} onChange={e=>setType(e.target.value)}>
                        {TYPE_OPTIONS.map(o=>(
                        <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                <label style={{ marginLeft: 16 }}>
                    Year:&nbsp;
                    <select value={year} onChange={e => setYear(+e.target.value)}>
                        {[...Array(5)].map((_, i) => {
                        const y = 2024 - i;
                        return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </label>
            </div>

            {loading
                ? <p>Loading…</p>
                : <div className="table-wrapper">
                    <table className="leaderboard-detail-table">
                    <thead>
                        <tr>
                        {cols.map(c=>(
                            <th key={c.key}>{c.label}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row,idx)=>(
                        <tr key={idx}>
                            {cols.map(c=>{
                            let v = row[c.key];
                            if (typeof v==='number') {
                                if (['AVG','OBP','SLG','ERA','WHIP','K9','BB9'].includes(c.key))
                                v = v.toFixed(3);
                                else if (['IP','OPS'].includes(c.key))
                                v = v.toFixed(1);
                            }
                            return <td key={c.key}>{v!=null?v:'—'}</td>;
                            })}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            }
        </div>
    );
}

export default LeaderBoardDetail;