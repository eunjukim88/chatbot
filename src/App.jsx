import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WorkerPage from "@/pages/WorkerPage";
import AdminLayout from "@/layouts/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import RequestsPage from "@/pages/admin/RequestsPage";
import RequestDetailPage from "@/pages/maintenance/RequestDetailPage";
import AdditionalInfoPage from "@/pages/worker/AdditionalInfoPage";

import MasterPage from "@/pages/admin/MasterPage";
import SettingsPage from "@/pages/admin/SettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorkerPage />} />
        <Route path="/maintenance/request/:id" element={<RequestDetailPage />} />
        <Route path="/additional-info/:requestId" element={<AdditionalInfoPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="master" element={<MasterPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
