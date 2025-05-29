"use client";

import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div>
      <div className="fixed bg-black top-0 left-0 w-screen h-screen z-50 flex items-center">
        <div className="flex items-center space-x-2 mx-auto text-white">
          <span className="animate-pulse text-5xl">Nucleus Dashboard</span>
          <Spinner variant="dots" size="lg" />
        </div>
      </div>
    </div>
  );
}
