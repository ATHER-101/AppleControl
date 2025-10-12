import React from "react";
import { Routes, Route } from "react-router-dom";
import ScannerPage from "./pages/ScannerPage";
import ControlPage from "./pages/ControlPage";

/**
 * App routes:
 *  - /         ScannerPage (camera scanner)
 *  - /control  ControlPage (trackpad + keyboard)
 */
export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<ScannerPage />} />
        <Route path="/control" element={<ControlPage />} />
      </Routes>
    </div>
  );
}