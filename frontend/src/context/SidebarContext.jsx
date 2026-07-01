import { createContext, useContext, useState, useCallback } from "react";

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);
  const toggleSidebar = useCallback(() => setMobileOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ mobileOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
};