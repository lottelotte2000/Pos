import React, { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen z-0 relative">
      <Sidebar />
      <div className="ml-64 transition-all duration-300 min-h-screen flex flex-col">
        <Header />
        <main className="pt-20 px-6 pb-6 flex-grow flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;