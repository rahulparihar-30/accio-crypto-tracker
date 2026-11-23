
import React, { useEffect, useState } from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./CoinCards.css";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 12;

const formatPrice = (price) => {
  if (price == null || !Number.isFinite(Number(price))) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: Number(price) < 1 ? 8 : 2,
  }).format(price);
};

const formatCompactCurrency = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const CoinCards = ({ coins = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate()

  const totalPages = Math.ceil(coins.length / PAGE_SIZE);

  const sendToCoin = (coinId) => {
    navigate(`/coin/${coinId}`)
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [coins]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentCoins = coins.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="coin-cards-container">

      {/* Cards Grid */}

      {coins.length === 0 ? (
        <div className="coin-empty">
          <h3>No cryptocurrencies found</h3>
          <p>Try again later or check your API response.</p>
        </div>
      ) : (
        <>
          <div className="coin-grid">
            {currentCoins.map((coin) => {
              const change = coin.price_change_percentage_24h;
              const hasChange = change != null && Number.isFinite(Number(change));
              const isPositive = Number(change) >= 0;

              return (
                <article className="coin-card" key={coin.id} onClick={() => sendToCoin(coin.id)}>

                  {/* Coin Header */}

                  <div className="coin-header">

                    <img
                      src={coin.image}
                      alt={`${coin.name} logo`}
                      className="coin-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />

                    <div className="coin-info">
                      <h3>{coin.name}</h3>
                      <span>{coin.symbol?.toUpperCase()}</span>
                    </div>

                  </div>

                  {/* Price Change */}

                  <div className="coin-change-row">

                    <span
                      className={`coin-change ${!hasChange
                        ? "neutral"
                        : isPositive
                          ? "positive"
                          : "negative"
                        }`}
                    >
                      {hasChange
                        ? `${isPositive ? "+" : ""}${Number(change).toFixed(2)}%`
                        : "N/A"}
                    </span>

                    <span
                      className={`coin-trend ${!hasChange
                        ? "neutral"
                        : isPositive
                          ? "positive"
                          : "negative"
                        }`}
                    >
                      {isPositive ? (
                        <TrendingUpIcon />
                      ) : (
                        <TrendingDownIcon />
                      )}
                    </span>

                  </div>

                  {/* Current Price */}

                  <div className="coin-price">
                    {formatPrice(coin.current_price)}
                  </div>

                  {/* Market Details */}

                  <div className="coin-details">

                    <div className="coin-detail">
                      <span>Total Volume</span>
                      <strong>
                        {formatCompactCurrency(coin.total_volume)}
                      </strong>
                    </div>

                    <div className="coin-detail">
                      <span>Market Cap</span>
                      <strong>
                        {formatCompactCurrency(coin.market_cap)}
                      </strong>
                    </div>

                  </div>

                </article>
              );
            })}
          </div>

          {/* Pagination */}

          {totalPages > 1 && (
            <div className="coin-pagination">

              <span className="pagination-info">
                Showing {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, coins.length)}
                {" "}of {coins.length} coins
              </span>

              <div className="pagination-controls">

                <button
                  className="pagination-arrow"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon />
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={`${page}-${index}`}
                    disabled={page === "..."}
                    onClick={() =>
                      typeof page === "number" &&
                      setCurrentPage(page)
                    }
                    className={`pagination-number ${currentPage === page ? "active" : ""
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="pagination-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </button>

              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default CoinCards;
