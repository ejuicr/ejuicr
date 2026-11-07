"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faFlask,
  faSliders,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthDialog } from "@/components/auth/AuthDialogContext";

const navigation = [
  { href: "/", label: "Calculator", icon: faFlask },
  { href: "/recipes", label: "Recipes", icon: faBookOpen },
  { href: "/settings", label: "Settings", icon: faSliders },
  { href: "/myaccount", label: "Account", icon: faUser },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openAuth } = useAuthDialog();
  const profilePic = user?.googlePicture || user?.twitterPicture;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const visibleNavigation = user
    ? navigation
    : navigation.filter((item) => item.href === "/");

  return (
    <header
      id="page-header"
      className={clsx("app-navigation", !user && "signed-out")}
    >
      <Link href="/" aria-label="ejuicr calculator" className="brand">
        <Image
          src="/logo.svg"
          alt="ejuicr"
          width={98}
          height={23}
          priority
          className="h-auto"
        />
      </Link>

      <nav className="primary-nav" aria-label="Main navigation">
        {visibleNavigation.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={clsx(isActive(href) && "active")}
          >
            <FontAwesomeIcon icon={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {user ? (
          <Link href="/myaccount" aria-label="View account" className="user-button">
            <span className="user-avatar">
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element -- matches account avatars, including remote and data URLs
                <img src={profilePic} alt="Your profile picture" referrerPolicy="no-referrer" />
              ) : (
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              )}
            </span>
            <span className="user-label">
              <span className="user-name">{user.email.split("@")[0]}</span>
              <span className="user-mail">{user.email}</span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            className="signin-button"
            aria-haspopup="dialog"
            onClick={openAuth}
          >
            Sign in
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
      </div>
    </header>
  );
}
