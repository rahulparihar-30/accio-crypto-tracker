
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShareIcon from "@mui/icons-material/Share";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function Home() {
    const navigate = useNavigate();

    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const handleDashboard = () => {
        navigate("/dashboard");
    };

    const handleShare = async () => {
        const shareData = {
            title: "CryptoTracker",
            text: "Track cryptocurrency prices, market trends and performance with CryptoTracker!",
            url: window.location.origin,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);

                setNotification({
                    open: true,
                    message: "App link copied to clipboard!",
                    severity: "success",
                });
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                setNotification({
                    open: true,
                    message: "Unable to share the application.",
                    severity: "error",
                });
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.18 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 25 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" },
        },
    };

    return (
        <>
            <main className="
                relative isolate w-full
                min-h-[calc(100svh-80px)]
                flex flex-col lg:flex-row
                items-center justify-between
                gap-8 lg:gap-12
                px-5 sm:px-10 lg:px-[7%]
                py-12 sm:py-16 lg:py-8
                overflow-hidden
                bg-background text-text
            ">

                {/* Background decoration */}
                <div className="
                    absolute -top-32 -left-32
                    w-96 h-96 rounded-full
                    bg-primary/10 blur-[100px]
                    pointer-events-none -z-10 mt-20
                " />

                <div className="
                    absolute bottom-0 right-0
                    w-96 h-96 rounded-full
                    bg-primary/10 blur-[120px]
                    pointer-events-none -z-10
                " />

                {/* Hero Content */}
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="
                        w-full lg:w-1/2
                        flex flex-col
                        items-center lg:items-start
                        text-center lg:text-left
                        gap-6 sm:gap-7
                        z-10
                    "
                >
                    {/* Badge */}
                    <motion.div
                        variants={itemVariants}
                        className="
                            inline-flex items-center gap-2
                            px-4 py-2 rounded-full
                            text-primary text-xs sm:text-sm font-semibold
                            bg-primary/10 border border-primary/20
                        "
                    >
                        <TrendingUpIcon fontSize="small" />
                        Real-time Crypto Insights
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        variants={itemVariants}
                        className="
                            flex flex-col
                            text-5xl sm:text-6xl
                            lg:text-7xl xl:text-[82px]
                            font-extrabold
                            tracking-tight
                            leading-[1.08]
                        "
                    >
                        <span>Track Crypto</span>

                        <span className="text-primary">
                            Real Time.
                        </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        variants={itemVariants}
                        className="
                            max-w-xl
                            text-base sm:text-lg
                            leading-relaxed
                            text-gray-500 dark:text-gray-400
                        "
                    >
                        Stay ahead of the market. Track cryptocurrency
                        prices, monitor market movements, analyze
                        performance and discover opportunities —
                        all in one place.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div
                        variants={itemVariants}
                        className="
                            flex flex-col sm:flex-row
                            items-center gap-4
                            w-full sm:w-auto
                            mt-2
                        "
                    >
                        <Button
                            variant="contained"
                            onClick={handleDashboard}
                            endIcon={<ArrowForwardIcon />}
                            className="!w-full sm:!w-auto"
                            sx={{
                                borderRadius: "50px",
                                padding: "13px 27px",
                                fontWeight: 700,
                                textTransform: "none",
                                backgroundColor: "var(--primary)",
                                boxShadow: "0 8px 25px rgba(37,99,235,.2)",
                                "&:hover": {
                                    backgroundColor: "var(--primary)",
                                    filter: "brightness(1.12)",
                                    transform: "translateY(-3px)",
                                },
                            }}
                        >
                            Explore Dashboard
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={handleShare}
                            startIcon={<ShareIcon />}
                            className="!w-full sm:!w-auto"
                            sx={{
                                borderRadius: "50px",
                                padding: "13px 27px",
                                fontWeight: 700,
                                textTransform: "none",
                                color: "var(--text)",
                                borderColor: "var(--border)",
                                "&:hover": {
                                    borderColor: "var(--primary)",
                                    color: "var(--primary)",
                                    backgroundColor: "rgba(37,99,235,.05)",
                                    transform: "translateY(-3px)",
                                },
                            }}
                        >
                            Share App
                        </Button>
                    </motion.div>

                    {/* Footer */}
                    <motion.div
                        variants={itemVariants}
                        className="
                            flex items-center gap-2
                            text-xs sm:text-sm
                            text-gray-500 dark:text-gray-400
                            mt-3
                        "
                    >
                        <TrendingUpIcon
                            sx={{ color: "#22c55e", fontSize: 19 }}
                        />
                        Market data powered by CoinGecko
                    </motion.div>
                </motion.section>

                {/* Phone Mockup */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.9, x: 40 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="
                        relative
                        w-full lg:w-1/2
                        max-w-[480px]
                        h-[390px] sm:h-[500px] lg:h-[580px]
                        flex items-center justify-center
                        shrink-0
                    "
                >
                    {/* Gradient Background */}
                    <motion.img
                        src="/gradient1.png"
                        alt=""
                        className="
                            absolute bottom-4 right-0
                            w-[80%] h-[80%]
                            object-cover rounded-[40px]
                            opacity-80
                        "
                    />

                    {/* Phone */}
                    <motion.img
                        src="/phone1.png"
                        alt="CryptoTracker mobile application preview"
                        className="
                            relative z-10
                            w-[75%] h-full
                            object-contain
                            drop-shadow-2xl
                        "
                        animate={{
                            y: [0, -16, 0],
                            rotate: [0, 1, 0, -1, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Floating Card */}
                    <motion.div
                        animate={{ y: [0, -9, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="
                            absolute z-20
                            bottom-16 sm:bottom-20
                            left-0 sm:-left-5
                            flex items-center gap-3
                            p-3 sm:p-4
                            rounded-2xl
                            bg-surface
                            border border-[var(--border)]
                            shadow-xl
                        "
                    >
                        <div className="
                            w-11 h-11 rounded-xl
                            bg-green-500/10
                            flex items-center justify-center
                        ">
                            <TrendingUpIcon sx={{ color: "#22c55e" }} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <strong className="text-sm text-text">
                                Market Overview
                            </strong>
                            <span className="
                                text-xs text-gray-500 dark:text-gray-400
                            ">
                                Track your favorite coins
                            </span>
                        </div>
                    </motion.div>
                </motion.section>
            </main>

            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={3000}
                onClose={() =>
                    setNotification(prev => ({
                        ...prev,
                        open: false,
                    }))
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    onClose={() =>
                        setNotification(prev => ({
                            ...prev,
                            open: false,
                        }))
                    }
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default Home;
