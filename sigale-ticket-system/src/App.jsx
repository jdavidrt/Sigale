import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "./context/EventContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";

function App() {
  return (
    <EventProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-event" element={<CreateEventPage />} />
            <Route path="/edit-event" element={<EditEventPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </EventProvider>
  );
}

export default App;
