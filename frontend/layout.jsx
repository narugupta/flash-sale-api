export const metadata = {
  title: "FlashBuy",
  description: "Live Flash Sale",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#09090b" }}>
        {children}
      </body>
    </html>
  );
}