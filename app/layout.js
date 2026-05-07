export const metadata = { title: "Sports AI Agents" };
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#05080f", fontFamily: "'Tajawal', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
