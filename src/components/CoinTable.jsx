
import React, { useEffect, useState } from "react";

import {
    Avatar,
    Box,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import "./CoinTable.css";

// Format normal currency
const formatCurrency = (value) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Number(value) < 1 ? 4 : 2,
    }).format(Number(value));
};

// Format compact currency
const formatCompactCurrency = (value) => {
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

function CoinTable({ coins = [] }) {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Reset page if the current page becomes invalid
    useEffect(() => {
        const maxPage = Math.max(
            0,
            Math.ceil(coins.length / rowsPerPage) - 1
        );

        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [coins.length, rowsPerPage, page]);

    // Get coins for current page
    const paginatedCoins = coins.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Price change component
    const renderChange = (change) => {

        if (
            change === null ||
            change === undefined ||
            !Number.isFinite(Number(change))
        ) {
            return (
                <Chip
                    label="N/A"
                    size="small"
                    variant="outlined"
                    className="coin-na-chip"
                />
            );
        }

        const value = Number(change);
        const positive = value >= 0;

        return (
            <Chip
                icon={
                    positive
                        ? <TrendingUpIcon />
                        : <TrendingDownIcon />
                }
                label={`${positive ? "+" : ""}${value.toFixed(2)}%`}
                size="small"
                color={positive ? "success" : "error"}
                variant="outlined"
                className="coin-change-chip"
            />
        );
    };

    // Pagination component shared by desktop and mobile
    const pagination = (
        <TablePagination
            component="div"
            count={coins.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            className="coin-pagination"
            sx={{
                color: "var(--text)",
                borderTop: "1px solid var(--border)",
                ".MuiTablePagination-selectIcon": {
                    color: "var(--text)",
                },
                ".MuiTablePagination-actions button": {
                    color: "var(--text)",
                },
                ".Mui-disabled": {
                    opacity: 0.3,
                },
                ".MuiTablePagination-select": {
                    color: "var(--text)",
                },
            }}
        />
    );

    // Mobile layout
    if (isMobile) {
        return (
            <Box className="coin-table-wrapper">

                <Stack spacing={2} className="coin-mobile-list">

                    {paginatedCoins.length === 0 ? (
                        <Typography className="coin-empty">
                            No cryptocurrencies found.
                        </Typography>
                    ) : (
                        paginatedCoins.map((coin) => (
                            <Paper
                                key={coin.id}
                                className="coin-mobile-card"
                                elevation={0}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={1}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        alignItems="center"
                                        minWidth={0}
                                    >
                                        <Avatar
                                            src={coin.image || undefined}
                                            alt={coin.name || "Coin"}
                                            sx={{ width: 42, height: 42 }}
                                        />

                                        <Box minWidth={0}>
                                            <Typography fontWeight={700} noWrap>
                                                {(coin.symbol || "").toUpperCase()}-USD
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                className="coin-muted"
                                                noWrap
                                            >
                                                {coin.name}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {renderChange(
                                        coin.price_change_percentage_24h
                                    )}
                                </Stack>

                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    mt={2}
                                >
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            className="coin-muted"
                                        >
                                            Price
                                        </Typography>

                                        <Typography fontWeight={700}>
                                            {formatCurrency(coin.current_price)}
                                        </Typography>
                                    </Box>

                                    <Box textAlign="right">
                                        <Typography
                                            variant="caption"
                                            className="coin-muted"
                                        >
                                            Market Cap
                                        </Typography>

                                        <Typography fontWeight={600}>
                                            {formatCompactCurrency(coin.market_cap)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Box mt={1.5}>
                                    <Typography
                                        variant="caption"
                                        className="coin-muted"
                                    >
                                        24H Volume
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {formatCompactCurrency(coin.total_volume)}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))
                    )}

                </Stack>

                {pagination}

            </Box>
        );
    }

    // Desktop / Tablet layout
    return (
        <Box className="coin-table-wrapper">

            <TableContainer
                component={Paper}
                elevation={0}
                className="coin-table-container"
            >
                <Table stickyHeader>

                    <TableHead>
                        <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell>24H Change</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>24H Volume</TableCell>
                            <TableCell>Market Cap</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>

                        {paginatedCoins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography className="coin-empty">
                                        No cryptocurrencies found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedCoins.map((coin) => (
                                <TableRow
                                    key={coin.id}
                                    hover
                                >
                                    <TableCell>
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                        >
                                            <Avatar
                                                src={coin.image || undefined}
                                                alt={coin.name || "Coin"}
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                }}
                                            />

                                            <Box>
                                                <Typography fontWeight={700}>
                                                    {(coin.symbol || "").toUpperCase()}-USD
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    className="coin-muted"
                                                >
                                                    {coin.name}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        {renderChange(
                                            coin.price_change_percentage_24h
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <Typography fontWeight={700}>
                                            {formatCurrency(coin.current_price)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        {formatCompactCurrency(coin.total_volume)}
                                    </TableCell>

                                    <TableCell>
                                        {formatCompactCurrency(coin.market_cap)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                    </TableBody>

                </Table>
            </TableContainer>

            {pagination}

        </Box>
    );
}

export default CoinTable;
