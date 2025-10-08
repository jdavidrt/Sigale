import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { TicketProvider } from "./context/TicketContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { SellTicketsPage } from "./pages/SellTicketsPage";
import { ValidateQRPage } from "./pages/ValidateQRPage";

function App() {
  return (
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
            </Routes>
          </Layout>
        </BrowserRouter>
      </TicketProvider>
    </EventProvider>
  );
}

export default App;
