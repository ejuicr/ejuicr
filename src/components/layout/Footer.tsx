import FooterMenu from "./FooterMenu";

export default function Footer() {
  return (
    <footer className="app-footer">
      <FooterMenu />
      <span className="footer-credits">
        <a
          href="https://www.jimfarrugia.com.au"
          target="_blank"
          rel="noreferrer"
        >
          Jim Farrugia
        </a>
        <a
          href="https://www.twitter.com/ejuicr"
          target="_blank"
          rel="noreferrer"
        >
          @ejuicr
        </a>
      </span>
    </footer>
  );
}
