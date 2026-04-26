import { Navbar } from "./Navbar";
import { StorageErrorBanner } from "../Common/StorageErrorBanner";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen">
      <StorageErrorBanner />
      <Navbar />
      <main>{children}</main>
    </div>
  );
};
