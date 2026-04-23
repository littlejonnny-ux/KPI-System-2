import type { Metadata } from "next";
import { Geologica, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

const geologica = Geologica({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KPI System",
  description: "Система управления KPI-картами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geologica.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
