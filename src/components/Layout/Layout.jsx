import { Navbar } from "./Navbar";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  );
};
