
import { useState, useEffect, useMemo } from "react";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";

import "./Dashboard.css";
import CoinTable from "./CoinTable";
import CoinCards from "./CoinCards";

const Dashboard = () => {
    const [view, setView] = useState("grid");
    const [search, setSearch] = useState("");
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCoins = async () => {
        try {
            setLoading(true);
            setError("");

            const url = new URL(
                `${import.meta.env.VITE_CRYPTO_API}/coins/markets`
            );

            url.search = new URLSearchParams({
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: "100",
                page: "1",
                sparkline: "false"
            });

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "x-cg-demo-api-key": import.meta.env.VITE_CRYPTO_KEY
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || JSON.stringify(data));
            }

            setCoins(data);

        } catch (error) {
            console.error("CoinGecko API Error:", error);
            setError("Unable to load cryptocurrencies. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoins();
    }, []);

    // Search coins
    const filteredCoins = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return coins;

        return coins.filter((coin) =>
            coin.name?.toLowerCase().includes(query) ||
            coin.symbol?.toLowerCase().includes(query) ||
            coin.id?.toLowerCase().includes(query)
        );
    }, [coins, search]);

    const clearSearch = () => {
        setSearch("");
    };

    return (
        <main className="dashboard">

            <div className="search-container">

                {/* Search */}
                <div className="search">
                    <SearchIcon />

                    <input
                        type="search"
                        name="search"
                        placeholder="Search cryptocurrencies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            aria-label="Clear search"
                            className="clear-search"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Grid / List Toggle */}
                <div className="view-toggle">
                    {[
                        ["grid", <GridViewIcon />],
                        ["list", <ViewListIcon />]
                    ].map(([v, icon]) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`view-button ${
                                view === v ? "active" : ""
                            }`}
                            aria-label={`${v} view`}
                            aria-pressed={view === v}
                        >
                            {icon}
                        </button>
                    ))}
                </div>

            </div>

            <div className="view-list w-full mt-[60px]">

                {loading ? (
                    <div className="search-message">
                        Loading cryptocurrencies...
                    </div>
                ) : error ? (
                    <div className="search-message error">
                        {error}
                        <button onClick={fetchCoins}>Retry</button>
                    </div>
                ) : filteredCoins.length > 0 ? (

                    view === "grid" ? (
                        <CoinCards coins={filteredCoins} />
                    ) : (
                        <CoinTable coins={filteredCoins} />
                    )

                ) : (
                    <div className="search-message">
                        <SearchIcon />
                        <h3>No cryptocurrencies found</h3>
                        <p>
                            No results for "{search}". Try another coin name
                            or symbol.
                        </p>

                        <button onClick={clearSearch}>
                            Clear Search
                        </button>
                    </div>
                )}

            </div>

        </main>
    );
};

export default Dashboard;
