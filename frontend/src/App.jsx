import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FleetDataProvider } from "./context/FleetDataContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Fleet from "./pages/Fleet";
import AssetDetail from "./pages/AssetDetail";
import RentalManagement from "./pages/RentalManagement";
import LiveMap from "./pages/LiveMap";
import Maintenance from "./pages/Maintenance";

export default function App() {
  return (
    <FleetDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/fleet/:id" element={<AssetDetail />} />
            <Route path="/rentals" element={<RentalManagement />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FleetDataProvider>
  );
}
