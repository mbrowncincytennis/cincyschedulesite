// app/layout.tsx
export const metadata = {
  title: "Site Usage Map",
  description: "Internal staff microsite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 👉 Replace the href below with your actual brand font(s). 
          Example shows Inter + Montserrat from Google Fonts. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <body
        style={{
          margin: 0,
          // Theme tokens (easy to tweak):
          // swap 'Inter' with your brand Sans if you have a hosted file
          fontFamily: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,
          background: "#f6f7f8",
          color: "#111",
        }}
      >
        {children}
      </body>
    </html>
  );
}
