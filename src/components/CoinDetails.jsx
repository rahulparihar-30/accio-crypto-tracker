
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import {
    Alert,
    Avatar,
    Box,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { motion, AnimatePresence } from "framer-motion";

import "./CoinDetails.css";

const API_URL = "https://api.coingecko.com/api/v3";

const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

const TIME_RANGES = [
    { label: "24H", days: "1" },
    { label: "7D", days: "7" },
    { label: "30D", days: "30" },
    { label: "90D", days: "90" },
    { label: "1Y", days: "365" },
];

const METRICS = [
    { label: "PRICE", key: "price" },
    { label: "MKT CAP", key: "market_cap" },
    { label: "VOLUME", key: "volume" },
];

const formatCurrency = (value) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Number(value) < 1 ? 6 : 2,
    }).format(Number(value));
};

const formatCompact = (value) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
    }).format(Number(value));
};

const formatNumber = (value) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(Number(value));
};

const formatDate = (timestamp, days) => {
    const date = new Date(timestamp);

    if (days === "1") {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
};

const getDescription = (description) => {
    if (!description) return "No description available.";

    return description
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
};

function CoinDetails() {

    const { coinId: routeCoinId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Support both /coin/bitcoin and /coin?id=bitcoin
    const coinId = routeCoinId || searchParams.get("id");

    const [coin, setCoin] = useState(null);
    const [chartData, setChartData] = useState([]);

    const [selectedRange, setSelectedRange] = useState("30");
    const [selectedMetric, setSelectedMetric] = useState("price");

    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch coin details
    useEffect(() => {

        if (!coinId) {
            setLoading(false);
            setError("No cryptocurrency ID was provided in the URL.");
            return;
        }

        const controller = new AbortController();

        const fetchCoinDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                    {
                        headers: API_KEY
                            ? { "x-cg-demo-api-key": API_KEY }
                            : {},
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? "Cryptocurrency not found."
                            : `Unable to fetch coin details (${response.status}).`
                    );
                }

                const data = await response.json();
                setCoin(data);

            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Something went wrong.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchCoinDetails();

        return () => controller.abort();

    }, [coinId]);

    // Fetch historical chart data
    useEffect(() => {

        if (!coinId) return;

        const controller = new AbortController();

        const fetchChartData = async () => {
            try {
                setChartLoading(true);

                const response = await fetch(
                    `${API_URL}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${selectedRange}`,
                    {
                        headers: API_KEY
                            ? { "x-cg-demo-api-key": API_KEY }
                            : {},
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to fetch historical chart data.");
                }

                const data = await response.json();

                const prices = data.prices || [];
                const marketCaps = data.market_caps || [];
                const volumes = data.total_volumes || [];

                const formattedData = prices.map((item, index) => ({
                    timestamp: item[0],
                    date: formatDate(item[0], selectedRange),

                    price: item[1],

                    market_cap: marketCaps[index]?.[1] ?? null,

                    volume: volumes[index]?.[1] ?? null,
                }));

                setChartData(formattedData);

            } catch (err) {
                if (err.name !== "AbortError") {
                    setChartData([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setChartLoading(false);
                }
            }
        };

        fetchChartData();

        return () => controller.abort();

    }, [coinId, selectedRange]);

    // Selected chart data
    const activeChartData = useMemo(() => {
        return chartData.filter(
            (item) => Number.isFinite(item[selectedMetric])
        );
    }, [chartData, selectedMetric]);

    // Determine graph color from selected metric
    const trendColor = useMemo(() => {

        if (activeChartData.length < 2) return "#3b82f6";

        const first = activeChartData[0][selectedMetric];
        const last = activeChartData[activeChartData.length - 1][selectedMetric];

        return last >= first ? "#22c55e" : "#ef4444";

    }, [activeChartData, selectedMetric]);

    const currentPrice = coin?.market_data?.current_price?.usd;

    const priceChange =
        coin?.market_data?.price_change_percentage_24h;

    const isPositive = Number(priceChange) >= 0;

    const metrics = [
        {
            label: "Market Cap",
            value: formatCompact(coin?.market_data?.market_cap?.usd),
        },
        {
            label: "24H Trading Volume",
            value: formatCompact(coin?.market_data?.total_volume?.usd),
        },
        {
            label: "Circulating Supply",
            value: formatNumber(coin?.market_data?.circulating_supply),
        },
        {
            label: "Total Supply",
            value: formatNumber(coin?.market_data?.total_supply),
        },
        {
            label: "Max Supply",
            value: formatNumber(coin?.market_data?.max_supply),
        },
        {
            label: "All-Time High",
            value: formatCurrency(coin?.market_data?.ath?.usd),
        },
        {
            label: "All-Time Low",
            value: formatCurrency(coin?.market_data?.atl?.usd),
        },
        {
            label: "Market Cap Rank",
            value: coin?.market_cap_rank
                ? `#${coin.market_cap_rank}`
                : "N/A",
        },
    ];

    // Loading state
    if (loading) {
        return (
            <Box className="coin-details-page">
                <Skeleton variant="rounded" height={130} />
                <Skeleton
                    variant="rounded"
                    height={450}
                    sx={{ mt: 3 }}
                />
                <Skeleton
                    variant="rounded"
                    height={180}
                    sx={{ mt: 3 }}
                />
            </Box>
        );
    }

    if (error || !coin) {
        return (
            <Box className="coin-details-page">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </Button>

                <Alert severity="error" sx={{ mt: 3 }}>
                    {error || "Coin details could not be loaded."}
                </Alert>
            </Box>
        );
    }

    return (
        <Box className="coin-details-page">

            {/* Back button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                className="coin-back-button"
            >
                Back to Market
            </Button>

            {/* Coin Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper elevation={0} className="coin-detail-header">

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                        gap={3}
                    >

                        <Stack direction="row" spacing={2} alignItems="center">

                            <Avatar
                                src={coin.image?.large}
                                alt={coin.name}
                                sx={{ width: 58, height: 58 }}
                            />

                            <Box>
                                <Typography variant="h5" fontWeight={800}>
                                    {coin.name}
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography className="coin-secondary">
                                        {coin.symbol.toUpperCase()} / USD
                                    </Typography>

                                    {coin.market_cap_rank && (
                                        <Chip
                                            label={`Rank #${coin.market_cap_rank}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </Box>

                        </Stack>

                        <Box>
                            <Typography className="coin-secondary">
                                Current Price
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight={800}
                                className="coin-current-price"
                            >
                                {formatCurrency(currentPrice)}
                            </Typography>

                            <Stack direction="row" alignItems="center" spacing={1}>
                                {isPositive
                                    ? <TrendingUpIcon color="success" />
                                    : <TrendingDownIcon color="error" />
                                }

                                <Typography
                                    fontWeight={700}
                                    color={isPositive ? "success.main" : "error.main"}
                                >
                                    {priceChange != null
                                        ? `${isPositive ? "+" : ""}${Number(priceChange).toFixed(2)}% (24H)`
                                        : "24H change unavailable"}
                                </Typography>
                            </Stack>
                        </Box>

                    </Stack>

                </Paper>
            </motion.div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
            >
                <Paper elevation={0} className="coin-chart-card">

                    {/* Chart Controls */}
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        gap={2}
                        mb={3}
                    >

                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Price History
                            </Typography>

                            <Typography variant="body2" className="coin-secondary">
                                Historical market performance
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            flexWrap="wrap"
                            gap={1}
                        >
                            {TIME_RANGES.map((range) => (
                                <Button
                                    key={range.days}
                                    size="small"
                                    variant={
                                        selectedRange === range.days
                                            ? "contained"
                                            : "outlined"
                                    }
                                    onClick={() => setSelectedRange(range.days)}
                                    className="coin-range-button"
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </Stack>

                    </Stack>

                    {/* Metric Selection */}
                    <Stack
                        direction="row"
                        justifyContent="center"
                        gap={1}
                        flexWrap="wrap"
                        mb={3}
                    >
                        {METRICS.map((metric) => (
                            <Button
                                key={metric.key}
                                size="small"
                                variant={
                                    selectedMetric === metric.key
                                        ? "contained"
                                        : "outlined"
                                }
                                onClick={() => setSelectedMetric(metric.key)}
                            >
                                {metric.label}
                            </Button>
                        ))}
                    </Stack>

                    {/* Chart Area */}
                    <Box className="coin-chart-area">

                        <AnimatePresence mode="wait">
                            {chartLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="coin-chart-loader"
                                >
                                    <CircularProgress size={32} />
                                    <Typography className="coin-secondary">
                                        Loading historical data...
                                    </Typography>
                                </motion.div>
                            ) : activeChartData.length === 0 ? (
                                <Box className="coin-chart-loader">
                                    <Typography className="coin-secondary">
                                        Historical chart data unavailable.
                                    </Typography>
                                </Box>
                            ) : (
                                <motion.div
                                    key={`${coinId}-${selectedRange}-${selectedMetric}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45 }}
                                    style={{ width: "100%", height: "100%" }}
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={activeChartData}
                                            margin={{
                                                top: 15,
                                                right: 20,
                                                left: 5,
                                                bottom: 5,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="coinChartGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor={trendColor}
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={trendColor}
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>

                                            <CartesianGrid
                                                stroke="var(--chart-grid)"
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />

                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(value) =>
                                                    formatDate(value, selectedRange)
                                                }
                                                stroke="var(--chart-muted)"
                                                tick={{
                                                    fill: "var(--chart-muted)",
                                                    fontSize: 11,
                                                }}
                                                minTickGap={35}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <YAxis
                                                domain={["auto", "auto"]}
                                                tickFormatter={(value) =>
                                                    formatCompact(value)
                                                }
                                                stroke="var(--chart-muted)"
                                                tick={{
                                                    fill: "var(--chart-muted)",
                                                    fontSize: 11,
                                                }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={75}
                                            />

                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--surface)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    color: "var(--text)",
                                                }}
                                                labelStyle={{
                                                    color: "var(--text)",
                                                }}
                                                labelFormatter={(value) =>
                                                    new Date(value).toLocaleString()
                                                }
                                                formatter={(value) => [
                                                    formatCurrency(value),
                                                    selectedMetric === "price"
                                                        ? "Price"
                                                        : selectedMetric === "market_cap"
                                                            ? "Market Cap"
                                                            : "Volume",
                                                ]}
                                            />

                                            <Area
                                                type="monotone"
                                                dataKey={selectedMetric}
                                                stroke={trendColor}
                                                strokeWidth={2.5}
                                                fill="url(#coinChartGradient)"
                                                fillOpacity={1}
                                                dot={false}
                                                activeDot={{
                                                    r: 5,
                                                    stroke: trendColor,
                                                    strokeWidth: 2,
                                                    fill: "var(--surface)",
                                                }}
                                                isAnimationActive={true}
                                                animationDuration={1200}
                                                animationEasing="ease-in-out"
                                            />

                                        </AreaChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </Box>

                </Paper>
            </motion.div>

            {/* Market Statistics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
            >
                <Typography variant="h5" fontWeight={800} mb={2}>
                    Market Statistics
                </Typography>

                <Grid container spacing={2}>

                    {metrics.map((item) => (
                        <Grid
                            item
                            xs={6}
                            sm={6}
                            md={3}
                            key={item.label}
                        >
                            <Paper
                                elevation={0}
                                className="coin-stat-card"
                            >
                                <Typography
                                    variant="body2"
                                    className="coin-secondary"
                                >
                                    {item.label}
                                </Typography>

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    mt={1}
                                >
                                    {item.value}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}

                </Grid>
            </motion.div>

            {/* About Coin */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
            >
                <Paper elevation={0} className="coin-description-card">

                    <Typography variant="h5" fontWeight={800} mb={2}>
                        About {coin.name}
                    </Typography>

                    <Typography
                        className="coin-description"
                        variant="body1"
                    >
                        {getDescription(coin.description?.en)}
                    </Typography>

                    {coin.links?.homepage?.[0] && (
                        <Button
                            href={coin.links.homepage[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            sx={{ mt: 3 }}
                        >
                            Official Website
                        </Button>
                    )}

                </Paper>
            </motion.div>

        </Box>
    );
}

export default CoinDetails;
