import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, settings }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background-secondary">
      <Navbar settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
};

export default Layout;
