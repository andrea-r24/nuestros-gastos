import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NuestrosGastos",
  description: "App de gastos compartidos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {/* Mobile-first: max-w-md centered. pb-20 reserves space for the fixed BottomNav. */}
        <div className="max-w-md mx-auto min-h-screen pb-20">{children}</div>
      </body>
    </html>
  );
}
