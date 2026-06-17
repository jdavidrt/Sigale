import { Navbar } from "./Navbar";
import { StorageErrorBanner } from "../Common/StorageErrorBanner";
import s from "./Layout.module.css";

export const Layout = ({ children }) => {
  return (
    <div className={s.app}>
      <StorageErrorBanner />
      <Navbar />
      <main>{children}</main>
    </div>
  );
};
