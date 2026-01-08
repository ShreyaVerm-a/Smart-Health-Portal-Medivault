import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider.jsx";
import MedicineReminders from "./components/MedicineReminders.jsx";
import "./i18n/config";
import Index from "./pages/Index.jsx";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MedicalRecords from "./pages/MedicalRecords";
import PatientRecords from "./pages/PatientRecords";
import MedicineTracker from "./pages/MedicineTracker";
import AddMedicine from "./pages/AddMedicine";
import AccessControl from "./pages/AccessControl";
import AIAssistant from "./pages/AIAssistant";
import UploadDocuments from "./pages/UploadDocuments";
import PatientSearch from "./pages/PatientSearch";
import Settings from "./pages/Settings";
import HospitalAdmin from "./pages/HospitalAdmin";
import Appointments from "./pages/Appointments";
import BookAppointment from "./pages/BookAppointment";
import WorkingHours from "./pages/WorkingHours";
import CompleteProfile from "./pages/CompleteProfile";
import TrashDocuments from "./pages/TrashDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MedicineReminders />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/patient-records/:patientId" element={<PatientRecords />} />
            <Route path="/medicine-tracker" element={<MedicineTracker />} />
            <Route path="/add-medicine" element={<AddMedicine />} />
            <Route path="/access-control" element={<AccessControl />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/working-hours" element={<WorkingHours />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/upload-documents" element={<UploadDocuments />} />
            <Route path="/patient-search" element={<PatientSearch />} />
            <Route path="/hospital-admin" element={<HospitalAdmin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trash" element={<TrashDocuments />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;