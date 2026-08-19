import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CaptionCraft AI — AI Video Caption Generator',
  description: 'Upload your video and automatically generate accurate, styled captions burned into your video with Google Gemini 2.5 Flash and FFmpeg.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
