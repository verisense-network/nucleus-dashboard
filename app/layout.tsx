import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import Header from "@/components/Header";
import { MetaData } from "@/config/website";

const montserrat = Montserrat({
  subsets: ["vietnamese"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: MetaData.title,
  description: MetaData.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} font-montserrat font-medium antialiased min-h-full`}
      >
        <main>
          <Providers>
            <Header />
            <div className="relative flex mt-16">
              <div className="w-[90vw] md:w-[65vw] md:max-w-[1280px] mx-auto py-4 md:inline-flex md:space-x-4">
                {children}
              </div>
            </div>
          </Providers>
        </main>
      </body>
    </html>
  );
}
