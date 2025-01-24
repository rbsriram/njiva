"use client";

import React, { useState } from "react";
import SidePanel from "@/components/SidePanel";

const SidebarWrapper: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <SidePanel
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
    />
  );
};

export default SidebarWrapper;
