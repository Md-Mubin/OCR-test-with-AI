import "./globals.css";

export const metadata = {
  title: "Cheque verification | Vaultline",
  description: "Verify cheque identity details against your profile.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
