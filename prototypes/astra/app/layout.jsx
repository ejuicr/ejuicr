import "./prototype.css";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas-neue", display: "swap" });

export const metadata = {
  title: "ejuicr · Astra UI prototypes",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return <html lang="en"><body className={bebasNeue.variable}>{children}</body></html>;
}
