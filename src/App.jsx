import "./App.css";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import CoinDetails from "./components/CoinDetails";
import CompareCoins from "./components/CompareCoins";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/coin/:coinId" element={<CoinDetails />} />
                <Route path="/compare" element={<CompareCoins />} />
            </Routes>
        </>
    );
}

export default App;
