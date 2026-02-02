'use client';

import { CenterPanel } from './center-panel';
import { LeftPanel } from './left-panel';
import { TopBar } from './top-bar';

export function DashboardContainer() {
  return (
    <div className="grid grid-rows-[80px_1fr] h-screen w-full bg-background font-sans overflow-hidden">
      {/* Top Bar Container */}
      <div className="col-span-full border-b border-border bg-background/60 backdrop-blur-md overflow-hidden z-20">
        <TopBar />
      </div>

      {/* Main Content Wrapper */}
      <div className="col-span-full grid grid-cols-[280px_1fr] overflow-hidden min-h-0">
        {/* Left Panel Container */}
        <div className="flex flex-col border-r border-border bg-background/30 overflow-y-auto overflow-x-hidden min-h-0">
          <LeftPanel />
        </div>

        {/* Center Panel Container */}
        <div className="flex flex-col border-r border-border bg-background/20 overflow-hidden min-h-0">
          <CenterPanel />
        </div>
      </div>
    </div>
  );
}
