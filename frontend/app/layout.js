import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import SessionProvider from "./components/SessionProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const roboto = Roboto({
  variable: "--font-robot",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
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
          <main className="flex-1 pt-10">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
