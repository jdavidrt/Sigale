import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { EventProvider } from "./context/EventContext";
import { TicketProvider } from "./context/TicketContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { SellTicketsPage } from "./pages/SellTicketsPage";
import { ValidateQRPage } from "./pages/ValidateQRPage";
import { CopyEventPage } from "./pages/CopyEventPage";
import { loadCharlyIllustration } from "./utils/svgTicketTemplate";
import { CHARLY_ILLUSTRATION_BASE64 } from "./assets/charlyIllustration";

function App() {
  // Load assets (Charly illustration) on app initialization
  useEffect(() => {
    loadCharlyIllustration(CHARLY_ILLUSTRATION_BASE64);
  }, []);

  return (
    <LanguageProvider>
      <EventProvider>
        <TicketProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-event" element={<CreateEventPage />} />
                <Route path="/edit-event" element={<EditEventPage />} />
                <Route path="/sell-tickets" element={<SellTicketsPage />} />
                <Route path="/validate-qr" element={<ValidateQRPage />} />
                <Route path="/copy-event" element={<CopyEventPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TicketProvider>
      </EventProvider>
    </LanguageProvider>
  );
}

export default App;
