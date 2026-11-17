import { Inter } from "next/font/google";
import "./globals.css";
import { AcDeviceProvider } from "../context/AcDeviceContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "AC Controller – Smart Monitor Control",
  description: "Securely control, monitor, and assign your air conditioning devices from one central dashboard.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFF4F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body className={inter.className}>
        <AcDeviceProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="colored"
            toastClassName="!rounded-xl !shadow-lg !text-sm"
          />
        </AcDeviceProvider>
      </body>
    </html>
  );
}