import { Roboto } from "next/font/google";
import "./globals.css";
import {Navbar} from "./components/navbar"
import Providers from "./providers";

const roboto = Roboto({
  variable: "--font-roboto",
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
        <Providers>
          <Navbar /> 
          <main className="flex-1 p-4 pt-17">{children}</main>
        </Providers>
      </body>
    </html>
    

  );
}

