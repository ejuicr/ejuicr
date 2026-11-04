import "./prototype.css";

export const metadata = {
  title: "ejuicr · Astra UI prototypes",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
