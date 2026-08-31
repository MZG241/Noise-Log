import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import "./dbConfig/db";
import { Toaster } from "sonner";


const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elizée Worship | Occupational Noise Exposure Logbook",
  description:
    "An occupational health & safety web system designed for live sound engineers to monitor cumulative noise exposure and protect hearing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}