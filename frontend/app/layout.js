import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar"; // <-- default import
import SessionProvider from "./components/SessionProvider";

const roboto = Roboto({
  variable: "--font-robot",
  subsets: ["latin"],
  weight: ["100","300","400","500","700","900"],
});

export const metadata = {
  title: "KUWHY",
  description: "ask ku",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="flex flex-col min-h-screen">
        <SessionProvider>
           <Navbar />
          <main className="flex-1 p-4 pt-17">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
