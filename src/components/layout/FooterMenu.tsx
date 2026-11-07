import Link from "next/link";

export default function FooterMenu() {
  return (
    <nav aria-label="Footer" className="footer-menu">
      <Link href="/about">About</Link>
      <Link href="/help">Help</Link>
      <Link href="/contribute">Contribute</Link>
      <Link href="/terms-of-service">Terms</Link>
      <Link href="/privacy-policy">Privacy</Link>
    </nav>
  );
}
