import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faUser } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faTwitter } from "@fortawesome/free-brands-svg-icons";
import type { PublicUser } from "@/types";

export default function UserProfile({ user }: { user: PublicUser }) {
  const authProvider = user.authProvider || null;
  const profilePic = user.googlePicture || user.twitterPicture || null;
  const profilePicAltText = user.googlePicture
    ? "Your Google profile picture"
    : user.twitterPicture
      ? "Your Twitter profile picture"
      : "Your profile picture";
  const providerName =
    authProvider === "google"
      ? user.googleDisplayName || "Google account"
      : authProvider === "twitter"
        ? user.twitterHandle
          ? `@${user.twitterHandle}`
          : "X / Twitter"
        : null;

  return (
    <div className="account-identity">
      <div className={profilePic ? "account-avatar" : "account-avatar empty"}>
        {profilePic ? (
          // eslint-disable-next-line @next/next/no-img-element -- profile pictures can be remote URLs or data URLs
          <img
            src={profilePic}
            alt={profilePicAltText}
            referrerPolicy="no-referrer"
          />
        ) : (
          <FontAwesomeIcon icon={faUser} aria-hidden="true" />
        )}
      </div>
      <div className="account-identity-copy">
        {providerName && (
          <p className="account-name">
            {authProvider === "google" ? (
              <FontAwesomeIcon icon={faGoogle} aria-hidden="true" />
            ) : (
              <FontAwesomeIcon icon={faTwitter} aria-hidden="true" />
            )}
            {providerName}
          </p>
        )}
        <p className="account-email">
          {!providerName && (
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
          )}
          {user.email}
        </p>
      </div>
    </div>
  );
}
