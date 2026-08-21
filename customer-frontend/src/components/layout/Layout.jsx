import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsApp from './FloatingWhatsApp';

const Layout = ({ children, settings }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background-secondary relative pb-20 md:pb-0">
      <Navbar settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingWhatsApp />
    </div>
  );
};

export default Layout;
