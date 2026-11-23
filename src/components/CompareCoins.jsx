
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    CircularProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
    useTheme,
    Chip
} from "@mui/material";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import { motion, AnimatePresence } from "framer-motion";

import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import "./CompareCoins.css";

const API_URL = "https://api.coingecko.com/api/v3";
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

const PERIODS = [
    { label: "7 Days", value: "7" },
    { label: "30 Days", value: "30" },
    { label: "90 Days", value: "90" },
    { label: "1 Year", value: "365" },
];

const COLORS = ["#22c55e", "#ef4444"];

const formatCurrency = (value) => {
    if (value == null || !Number.isFinite(Number(value))) return "N/A";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Number(value) < 1 ? 5 : 2,
    }).format(value);
};

const formatPercentage = (value) => {
    if (value == null || !Number.isFinite(Number(value))) return "N/A";

    return `${value >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`;
};

const getHeaders = () =>
    API_KEY ? { "x-cg-demo-api-key": API_KEY } : {};

const getPerformance = (points) => {
    if (!points?.length) return [];

    const initialPrice = points[0][1];

    if (!initialPrice) return [];

    return points.map(([timestamp, price]) => ({
        timestamp,
        performance: ((price - initialPrice) / initialPrice) * 100,
    }));
};

const interpolatePerformance = (points, timestamp) => {
    if (!points?.length) return null;

    if (timestamp <= points[0].timestamp) {
        return points[0].performance;
    }

    if (timestamp >= points[points.length - 1].timestamp) {
        return points[points.length - 1].performance;
    }

    let low = 0;
    let high = points.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (points[mid].timestamp === timestamp) {
            return points[mid].performance;
        }

        if (points[mid].timestamp < timestamp) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const previous = points[high];
    const next = points[low];

    const ratio =
        (timestamp - previous.timestamp) /
        (next.timestamp - previous.timestamp);

    return (
        previous.performance +
        ratio * (next.performance - previous.performance)
    );
};

function CompareCoins() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [coins, setCoins] = useState([]);

    const [coinOne, setCoinOne] = useState(null);
    const [coinTwo, setCoinTwo] = useState(null);

    const [period, setPeriod] = useState("30");

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch available cryptocurrencies

    useEffect(() => {
        const controller = new AbortController();

        const fetchCoins = async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: "250",
                    page: "1",
                    sparkline: "false",
                    price_change_percentage: "24h",
                });

                const response = await fetch(
                    `${API_URL}/coins/markets?${params}`,
                    {
                        headers: getHeaders(),
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(`CoinGecko error: ${response.status}`);
                }

                const data = await response.json();

                setCoins(data);

                setCoinOne(
                    data.find((coin) => coin.id === "bitcoin") || data[0]
                );

                setCoinTwo(
                    data.find((coin) => coin.id === "ethereum") || data[1]
                );

            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Failed to load coins.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchCoins();

        return () => controller.abort();
    }, []);

    // Fetch historical data for both selected coins

    const fetchComparison = useCallback(async (first, second, days) => {
        if (!first || !second || first.id === second.id) return;

        const controller = new AbortController();

        setChartLoading(true);
        setError("");

        try {
            const fetchHistory = async (coinId) => {
                const params = new URLSearchParams({
                    vs_currency: "usd",
                    days,
                });

                const response = await fetch(
                    `${API_URL}/coins/${coinId}/market_chart?${params}`,
                    {
                        headers: getHeaders(),
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Historical data unavailable (${response.status})`
                    );
                }

                return response.json();
            };

            const [firstHistory, secondHistory] = await Promise.all([
                fetchHistory(first.id),
                fetchHistory(second.id),
            ]);

            const firstSeries = getPerformance(firstHistory.prices);
            const secondSeries = getPerformance(secondHistory.prices);

            const combined = firstSeries.map((point) => ({
                timestamp: point.timestamp,
                first: point.performance,
                second: interpolatePerformance(
                    secondSeries,
                    point.timestamp
                ),
            }));

            setChartData(combined);

        } catch (err) {
            if (err.name !== "AbortError") {
                console.error(err);
                setChartData([]);
                setError(err.message || "Unable to fetch historical data.");
            }
        } finally {
            setChartLoading(false);
        }

        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!coinOne || !coinTwo || coinOne.id === coinTwo.id) return;

        let cancelled = false;

        const load = async () => {
            setChartLoading(true);
            setError("");

            try {
                const fetchHistory = async (coinId) => {
                    const params = new URLSearchParams({
                        vs_currency: "usd",
                        days: period,
                    });

                    const response = await fetch(
                        `${API_URL}/coins/${coinId}/market_chart?${params}`,
                        { headers: getHeaders() }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Historical data unavailable (${response.status})`
                        );
                    }

                    return response.json();
                };

                const [firstHistory, secondHistory] = await Promise.all([
                    fetchHistory(coinOne.id),
                    fetchHistory(coinTwo.id),
                ]);

                if (cancelled) return;

                const firstSeries = getPerformance(firstHistory.prices);
                const secondSeries = getPerformance(secondHistory.prices);

                const combined = firstSeries.map((point) => ({
                    timestamp: point.timestamp,
                    first: point.performance,
                    second: interpolatePerformance(
                        secondSeries,
                        point.timestamp
                    ),
                }));

                setChartData(combined);

            } catch (err) {
                if (!cancelled) {
                    setChartData([]);
                    setError(err.message || "Unable to fetch chart data.");
                }
            } finally {
                if (!cancelled) setChartLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [coinOne, coinTwo, period]);

    // Chart summary

    const firstPerformance = chartData.length
        ? chartData[chartData.length - 1].first
        : null;

    const secondPerformance = chartData.length
        ? chartData[chartData.length - 1].second
        : null;

    const chartColor = isDark ? "#777f8e" : "#94a3b8";

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
        });
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;

        return (
            <Paper className="compare-tooltip" elevation={4}>
                <Typography variant="caption" color="text.secondary">
                    {formatDate(payload[0].payload.timestamp)}
                </Typography>

                {payload.map((item) => (
                    <Stack
                        key={item.dataKey}
                        direction="row"
                        justifyContent="space-between"
                        spacing={3}
                        alignItems="center"
                    >
                        <Typography variant="body2" fontWeight={600}>
                            {item.name}
                        </Typography>

                        <Typography
                            fontWeight={700}
                            sx={{ color: item.color }}
                        >
                            {formatPercentage(item.value)}
                        </Typography>
                    </Stack>
                ))}
            </Paper>
        );
    };

    if (loading) {
        return (
            <Box className="compare-loading">
                <CircularProgress />
                <Typography color="text.secondary">
                    Loading cryptocurrencies...
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="performance-compare">

            {/* Heading */}

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    mb={3}
                >
                    <Box className="compare-title-icon">
                        <CompareArrowsIcon />
                    </Box>

                    <Box>
                        <Typography variant="h5" fontWeight={800}>
                            Compare Cryptocurrencies
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Compare historical market performance
                        </Typography>
                    </Box>
                </Stack>
            </motion.div>

            {/* Selectors */}

            <Paper className="compare-chart-card" elevation={0}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    spacing={3}
                    flexWrap="wrap"
                    className="compare-controls"
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        flex={1}
                    >
                        <Typography fontWeight={600}>
                            Crypto 1
                        </Typography>

                        <Autocomplete
                            size="small"
                            options={coins}
                            value={coinOne}
                            onChange={(_, value) => setCoinOne(value)}
                            getOptionLabel={(option) => option.name || ""}
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            src={option.image}
                                            sx={{ width: 25, height: 25 }}
                                        />
                                        {option.name}
                                    </Stack>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select coin"
                                />
                            )}
                            sx={{ minWidth: { xs: "100%", sm: 190 } }}
                        />
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        flex={1}
                    >
                        <Typography fontWeight={600}>
                            Crypto 2
                        </Typography>

                        <Autocomplete
                            size="small"
                            options={coins.filter(
                                (coin) => coin.id !== coinOne?.id
                            )}
                            value={coinTwo}
                            onChange={(_, value) => setCoinTwo(value)}
                            getOptionLabel={(option) => option.name || ""}
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            src={option.image}
                                            sx={{ width: 25, height: 25 }}
                                        />
                                        {option.name}
                                    </Stack>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select coin"
                                />
                            )}
                            sx={{ minWidth: { xs: "100%", sm: 190 } }}
                        />
                    </Stack>

                    <Select
                        size="small"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ minWidth: 125 }}
                    >
                        {PERIODS.map((item) => (
                            <MenuItem key={item.value} value={item.value}>
                                {item.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>

                {coinOne && coinTwo && coinOne.id === coinTwo.id && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Please select two different cryptocurrencies.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Chart */}

                <Box className="compare-chart-wrapper">

                    {chartLoading && (
                        <Box className="compare-chart-loading">
                            <CircularProgress />
                            <Typography color="text.secondary">
                                Loading historical performance...
                            </Typography>
                        </Box>
                    )}

                    {!chartLoading && chartData.length > 0 && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${coinOne?.id}-${coinTwo?.id}-${period}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="compare-chart"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 20,
                                            left: 5,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke={chartColor}
                                            vertical={false}
                                            opacity={0.2}
                                        />

                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={formatDate}
                                            stroke={chartColor}
                                            tick={{ fontSize: 12 }}
                                            minTickGap={35}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                                            stroke={chartColor}
                                            tick={{ fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={55}
                                        />

                                        <Tooltip
                                            content={<CustomTooltip />}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="first"
                                            name={coinOne?.name}
                                            stroke={COLORS[0]}
                                            strokeWidth={2.8}
                                            dot={false}
                                            activeDot={{
                                                r: 6,
                                                strokeWidth: 0,
                                            }}
                                            isAnimationActive
                                            animationDuration={1600}
                                            animationEasing="ease-out"
                                            connectNulls
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="second"
                                            name={coinTwo?.name}
                                            stroke={COLORS[1]}
                                            strokeWidth={2.8}
                                            dot={false}
                                            activeDot={{
                                                r: 6,
                                                strokeWidth: 0,
                                            }}
                                            isAnimationActive
                                            animationDuration={1800}
                                            animationEasing="ease-out"
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {!chartLoading && !error && chartData.length === 0 && (
                        <Box className="compare-chart-empty">
                            <Typography color="text.secondary">
                                Select two cryptocurrencies to view their performance.
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Legend */}

                <Stack
                    direction="row"
                    justifyContent="center"
                    flexWrap="wrap"
                    gap={4}
                    mt={2}
                >
                    {[coinOne, coinTwo].map((coin, index) => (
                        coin && (
                            <Stack
                                key={coin.id}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                            >
                                <Box
                                    sx={{
                                        width: 25,
                                        height: 3,
                                        borderRadius: 2,
                                        bgcolor: COLORS[index],
                                    }}
                                />

                                <Avatar
                                    src={coin.image}
                                    sx={{ width: 23, height: 23 }}
                                />

                                <Typography fontWeight={600} variant="body2">
                                    {coin.name}
                                </Typography>
                            </Stack>
                        )
                    ))}
                </Stack>

                <Typography
                    textAlign="center"
                    variant="caption"
                    color="text.secondary"
                    mt={2}
                    display="block"
                >
                    Performance is normalized to 0% at the beginning of the selected period.
                </Typography>
            </Paper>

            {/* Performance Summary */}

            {!chartLoading && chartData.length > 0 && (
                <Box className="compare-summary-grid">
                    {[coinOne, coinTwo].map((coin, index) => {
                        const performance =
                            index === 0
                                ? firstPerformance
                                : secondPerformance;

                        const positive = performance >= 0;

                        return (
                            <motion.div
                                key={coin.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15 }}
                            >
                                <Paper
                                    className="compare-summary-card"
                                    elevation={0}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1.5}
                                    >
                                        <Avatar src={coin.image} />

                                        <Box flex={1} minWidth={0}>
                                            <Typography fontWeight={700} noWrap>
                                                {coin.name}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {coin.symbol.toUpperCase()} / USD
                                            </Typography>
                                        </Box>

                                        <Chip
                                            size="small"
                                            icon={
                                                positive
                                                    ? <TrendingUpIcon />
                                                    : <TrendingDownIcon />
                                            }
                                            label={formatPercentage(performance)}
                                            sx={{
                                                color: positive ? "#16a34a" : "#ef4444",
                                                bgcolor: positive
                                                    ? "rgba(34,197,94,0.12)"
                                                    : "rgba(239,68,68,0.12)",
                                                fontWeight: 700,
                                            }}
                                        />
                                    </Stack>

                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        mt={3}
                                    >
                                        {formatCurrency(coin.current_price)}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Current price
                                    </Typography>
                                </Paper>
                            </motion.div>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

export default CompareCoins;
