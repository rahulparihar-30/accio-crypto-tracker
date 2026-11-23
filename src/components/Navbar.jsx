
import { useState, useEffect } from "react";
import "./Navbar.css";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { CloseRounded, DarkModeRounded, LightModeRounded } from "@mui/icons-material";

import {
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from "@mui/material";

function Navbar() {
    const [isOpen, setOpen] = useState(false);

    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme ? savedTheme === "dark" : true;
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark((prev) => !prev);
    };

    const toggleDrawer = (value) => {
        setOpen(value);
    };

    const navLinks = ["Home", "Compare","Dashboard"];

    return (
        <nav className="navbar">

            <h2 className="brandLogo">
                CryptoTracker<span className="text-primary">.</span>
            </h2>

            <div className="desktop-nav">
                {navLinks.map((link) => (
                    <a
                        href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
                        className={link.toLowerCase() === "dashboard" ? "dashboard-btn" : ""}
                        key={link}
                    >
                        {link}
                    </a>
                ))}
            </div>

            <div className="navbar-actions">

                {/* Theme Toggle */}
                <IconButton
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    sx={{ color: "var(--text)" }}
                >
                    {isDark ? <LightModeRounded /> : <DarkModeRounded />}
                </IconButton>

                {/* Mobile Menu */}
                <IconButton
                    className="menu-button"
                    onClick={() => toggleDrawer(true)}
                    aria-label="Open navigation menu"
                    sx={{ color: "var(--text)" }}
                >
                    <MenuRoundedIcon fontSize="large" />
                </IconButton>

            </div>

            <Drawer
                anchor="right"
                open={isOpen}
                onClose={() => toggleDrawer(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: "var(--surface)",
                        color: "var(--text)",
                        width: 280
                    }
                }}
            >
                <div className="drawer-content">

                    <div className="drawer-header">
                        <h2 className="brandLogo">
                            CryptoTracker<span className="text-primary">.</span>
                        </h2>

                        <IconButton
                            onClick={() => toggleDrawer(false)}
                            sx={{ color: "var(--text)" }}
                        >
                            <CloseRounded fontSize="large" />
                        </IconButton>
                    </div>

                    <List>
                        {navLinks.map((link) => (
                            <ListItem key={link} disablePadding>
                                <ListItemButton
                                    onClick={() => toggleDrawer(false)}
                                >
                                    <ListItemText primary={link} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>

                    <div className="drawer-theme">
                        <ListItemButton onClick={toggleTheme}>
                            {isDark ? (
                                <LightModeRounded />
                            ) : (
                                <DarkModeRounded />
                            )}

                            <ListItemText
                                primary={isDark ? "Light Mode" : "Dark Mode"}
                                sx={{ ml: 2 }}
                            />
                        </ListItemButton>
                    </div>

                </div>
            </Drawer>

        </nav>
    );
}

export default Navbar;
