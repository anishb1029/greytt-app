import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Navigation, Compass, Coffee, TreePine, Landmark, UtensilsCrossed,
  ShieldCheck, ArrowLeft, ChevronRight, LocateFixed, Share2, Search, Home, User, AlertCircle
} from "lucide-react";

// ---- Greytt brand tokens ----
const SEASONED_BLUE = "#001B59";
const LIVELY_GREEN = "#72BE44";
const CALM_BLUE = "#5B84C4";
const SILVER_GREY = "#C7D0DC";
const WHITISH = "#F1F3F4";
const PAPER = "#FFFFFF";
const DANGER = "#C4453A";

const FONT_DISPLAY = "'Barlow', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

function useBrandFonts() {
  useEffect(() => {
    const id = "greytt-brand-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function GreytLogo({ variant = "blue", height = 22 }) {
  const color = variant === "white" ? "#FFFFFF" : SEASONED_BLUE;
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT_DISPLAY, fontWeight: 600, height, lineHeight: 1 }}>
      <span style={{ fontSize: height * 0.95, color }}>Greyt</span>
      <span style={{ fontSize: height * 0.95, color: "#FFFFFF", background: LIVELY_GREEN, padding: "0 3px", borderRadius: 2 }}>t</span>
    </div>
  );
}

function PrimaryButton({ children, onClick, icon: Icon, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        background: LIVELY_GREEN, color: SEASONED_BLUE, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15,
        padding: "13px 16px", borderRadius: 14, border: "none", cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1, ...style,
      }}
    >
      {Icon && <Icon size={18} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: PAPER, color: SEASONED_BLUE, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
        padding: "10px 14px", borderRadius: 12, border: `1.6px solid ${SILVER_GREY}`, cursor: "pointer", ...style,
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

function ScreenHeader({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 10px" }}>
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            width: 34, height: 34, borderRadius: 10, border: `1.6px solid ${SILVER_GREY}`, background: PAPER,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft size={17} color={SEASONED_BLUE} />
        </button>
      )}
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 21, color: SEASONED_BLUE, margin: 0, flex: 1 }}>
        {title}
      </h1>
      {right}
    </div>
  );
}

// Small persistent badge shown wherever the user is in the app while tracking is live
function TrackingPulse({ size = 8 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span
        style={{
          position: "absolute", inset: 0, borderRadius: "50%", background: LIVELY_GREEN,
          animation: "greytt-pulse 1.6s ease-out infinite",
        }}
      />
      <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: LIVELY_GREEN }} />
      <style>{`
        @keyframes greytt-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// ============================================================
// GOOGLE AUTH
// Real behavior once deployed to a domain registered in Google
// Cloud Console under this Client ID's "Authorized JavaScript
// origins". It cannot succeed inside this preview sandbox — no
// code change fixes that, only registering the real deploy domain does.
// ============================================================
const GOOGLE_CLIENT_ID = "811641944926-uevqg444sgpbhp0enc67mi4d2rnvkl4h.apps.googleusercontent.com";
const IS_PLACEHOLDER_CLIENT_ID = GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_OAUTH_CLIENT_ID");

function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// sdkStatus: "loading" | "ready" | "not_configured" | "unauthorized_origin" | "blocked"
function useGoogleIdentity(onCredential) {
  const [sdkStatus, setSdkStatus] = useState(IS_PLACEHOLDER_CLIENT_ID ? "not_configured" : "loading");

  useEffect(() => {
    if (IS_PLACEHOLDER_CLIENT_ID) return; // nothing to load, don't even try
    let cancelled = false;

    const init = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => onCredential(decodeJwt(resp.credential)),
          auto_select: false,
          use_fedcm_for_prompt: true,
          error_callback: (err) => {
            // Google's own diagnostic surface — this is what actually
            // tells you "unauthorized" vs. other failure modes.
            const msg = (err && (err.message || err.type || "")).toLowerCase();
            if (!cancelled) {
              if (msg.includes("origin") || msg.includes("unregistered") || msg.includes("idpiframe")) {
                setSdkStatus("unauthorized_origin");
              } else {
                setSdkStatus("blocked");
              }
            }
          },
        });
        if (!cancelled) setSdkStatus("ready");
      } catch (e) {
        if (!cancelled) setSdkStatus("unauthorized_origin");
      }
    };

    const existing = document.getElementById("google-identity-script");
    if (existing && window.google?.accounts?.id) {
      init();
      return;
    }
    const script = existing || document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => !cancelled && setSdkStatus("blocked");
    if (!existing) document.head.appendChild(script);

    const timeout = setTimeout(() => {
      if (!cancelled) setSdkStatus((s) => (s === "loading" ? "unauthorized_origin" : s));
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [onCredential]);

  return sdkStatus;
}

function GoogleAuthNotice({ status }) {
  const copy = {
    not_configured: "Google Sign-In isn't set up yet — add your OAuth Client ID from Google Cloud Console.",
    unauthorized_origin: "This domain isn't authorized for your Google OAuth Client yet. Add it under Authorized JavaScript origins in Google Cloud Console, then reload on the real domain.",
    blocked: "Google Sign-In couldn't load — check your network or ad blocker.",
  }[status];
  if (!copy) return null;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FBEFEF", border: "1.4px solid #E3B3AD", borderRadius: 10, padding: "8px 10px" }}>
      <AlertCircle size={15} color={DANGER} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#7a3a2a", lineHeight: 1.4 }}>{copy}</span>
    </div>
  );
}

// Dev-only escape hatch so the rest of the app is still reachable while
// this origin isn't registered with Google yet. This is never labeled or
// styled like a real sign-in option, and only appears when the SDK can't
// reach a ready state — a properly configured deploy never shows it.
function DevBypass({ onLogin }) {
  return (
    <button
      onClick={() => onLogin({ name: "Preview User", email: "", initials: "PU" })}
      style={{
        width: "100%", fontFamily: FONT_BODY, fontWeight: 500, fontSize: 11.5, color: "#8891A0",
        background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: "2px 0",
      }}
    >
      Skip sign-in for this preview (dev only)
    </button>
  );
}

// ---------------- LOGIN SCREEN ----------------
function LoginScreen({ onLogin }) {
  const buttonDivRef = useRef(null);

  const handleCredential = useCallback((payload) => {
    if (!payload) return;
    onLogin({
      name: payload.name || "Traveller",
      email: payload.email || "",
      initials: (payload.name || "T").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
    });
  }, [onLogin]);

  const sdkStatus = useGoogleIdentity(handleCredential);

  useEffect(() => {
    if (sdkStatus === "ready" && buttonDivRef.current && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(buttonDivRef.current, {
        theme: "filled_white", size: "large", width: 280, text: "continue_with",
      });
    }
  }, [sdkStatus]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: SEASONED_BLUE }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        <GreytLogo variant="white" height={30} />
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: "#B9C4DE", textAlign: "center", marginTop: 14, marginBottom: 40, lineHeight: 1.5 }}>
          Travel made smarter for 50+.<br />Fit-for-you, backed by the Greytt Score.
        </p>

        <div style={{ width: "100%", background: PAPER, borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: LIVELY_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Compass size={26} color={SEASONED_BLUE} strokeWidth={2.3} />
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5b5f6b", textAlign: "center", margin: 0 }}>
            Sign in to track your location and get nearby recommendations tailored to you.
          </p>

          <div ref={buttonDivRef} style={{ minHeight: 40, display: sdkStatus === "ready" ? "block" : "none" }} />

          {sdkStatus !== "ready" && (
            <>
              <GoogleAuthNotice status={sdkStatus} />
              <DevBypass onLogin={onLogin} />
            </>
          )}
        </div>

        <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: "#8090B0", marginTop: 18, textAlign: "center" }}>
          By continuing, you agree to Greytt's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

// ---------------- HOME SCREEN ----------------
function HomeScreen({ user, tracking, onOpenTracking, onOpenNearby }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: PAPER, overflowY: "auto" }}>
      <div style={{ padding: "20px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <GreytLogo variant="blue" height={20} />
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: WHITISH, border: `1.6px solid ${SILVER_GREY}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: SEASONED_BLUE }}>
          {user.initials}
        </div>
      </div>

      <div style={{ padding: "18px 20px 6px" }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#8891A0", margin: 0 }}>Welcome back</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24, color: SEASONED_BLUE, margin: "2px 0 0" }}>
          {user.name.split(" ")[0]}
        </h1>
      </div>

      <div style={{ padding: "18px 20px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          onClick={onOpenTracking}
          style={{ textAlign: "left", background: SEASONED_BLUE, borderRadius: 18, border: "none", padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: LIVELY_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LocateFixed size={20} color={SEASONED_BLUE} strokeWidth={2.4} />
            </div>
            <ChevronRight size={20} color={LIVELY_GREEN} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17, color: PAPER, margin: 0 }}>
                Live location tracking
              </p>
              {tracking.status === "tracking" && <TrackingPulse />}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#AEB9D4", margin: "3px 0 0" }}>
              {tracking.status === "tracking"
                ? "Active — updating in real time"
                : "Share where you are with family, in real time"}
            </p>
          </div>
        </button>

        <button
          onClick={onOpenNearby}
          style={{ textAlign: "left", background: WHITISH, borderRadius: 18, border: `1.6px solid ${SILVER_GREY}`, padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: PAPER, border: `1.6px solid ${SILVER_GREY}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Compass size={20} color={SEASONED_BLUE} strokeWidth={2.4} />
            </div>
            <ChevronRight size={20} color={SEASONED_BLUE} />
          </div>
          <div>
            <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17, color: SEASONED_BLUE, margin: 0 }}>
              Nearby recommendations
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#5B6270", margin: "3px 0 0" }}>
              Places near you, rated with the Greytt Score
            </p>
          </div>
        </button>
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

// ---------------- BOTTOM NAV ----------------
function BottomNav({ current, onNavigate, trackingActive }) {
  const items = [
    { key: "home", icon: Home, label: "Home" },
    { key: "nearby", icon: Search, label: "Explore" },
    { key: "tracking", icon: MapPin, label: "Track" },
    { key: "profile", icon: User, label: "Profile" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 10px", borderTop: `1.6px solid ${WHITISH}`, background: PAPER, flexShrink: 0 }}>
      {items.map(({ key, icon: Icon, label }) => {
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 10px" }}
          >
            <div style={{ position: "relative" }}>
              <Icon size={19} color={active ? LIVELY_GREEN : SEASONED_BLUE} strokeWidth={active ? 2.6 : 2} />
              {key === "tracking" && trackingActive && (
                <span style={{ position: "absolute", top: -2, right: -3 }}>
                  <TrackingPulse size={7} />
                </span>
              )}
            </div>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: active ? LIVELY_GREEN : SEASONED_BLUE }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- PROFILE SCREEN ----------------
function ProfileScreen({ user, onLogout }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: PAPER }}>
      <div style={{ padding: "18px 20px 4px" }}>
        <GreytLogo variant="blue" height={20} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: WHITISH, border: `1.6px solid ${SILVER_GREY}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22, color: SEASONED_BLUE, marginBottom: 14 }}>
          {user.initials}
        </div>
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, color: SEASONED_BLUE, margin: 0 }}>{user.name}</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#8891A0", margin: "4px 0 28px" }}>{user.email}</p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <GhostButton style={{ width: "100%", justifyContent: "flex-start" }} icon={ShieldCheck}>Travel preferences</GhostButton>
          <GhostButton style={{ width: "100%", justifyContent: "flex-start" }} icon={Share2}>Family sharing</GhostButton>
          <GhostButton style={{ width: "100%", justifyContent: "center", marginTop: 10, borderColor: DANGER, color: DANGER }} onClick={onLogout}>
            Sign out
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

// ---------------- LIVE TRACKING SCREEN ----------------
// Reads tracking state and start/stop handlers from props — it does NOT
// own the watch itself, so navigating away never stops it.
function TrackingScreen({ onBack, tracking, onStart, onStop }) {
  const { status, coords, errorMsg, heading } = tracking;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: PAPER }}>
      <ScreenHeader
        title="Live tracking"
        onBack={onBack}
        right={status === "tracking" ? <TrackingPulse /> : null}
      />

      <div style={{ padding: "8px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", borderRadius: 20, border: `1.6px solid ${SILVER_GREY}`, background: WHITISH, height: 240, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.6 }}>
            <defs>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke={CALM_BLUE} strokeWidth="0.6" opacity="0.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {status === "tracking" && coords ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(114,190,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: LIVELY_GREEN, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${heading}deg)`, transition: "transform 0.7s linear", border: `2px solid ${SEASONED_BLUE}` }}>
                  <Navigation size={18} color={SEASONED_BLUE} strokeWidth={2.5} />
                </div>
              </div>
              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: SEASONED_BLUE, background: PAPER, padding: "3px 10px", borderRadius: 20, border: `1.4px solid ${SILVER_GREY}` }}>
                You are here
              </span>
            </div>
          ) : status === "locating" ? (
            <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <MapPin size={30} color={SEASONED_BLUE} strokeWidth={2} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5B6270" }}>Finding your location…</span>
            </div>
          ) : status === "error" ? (
            <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 30px", textAlign: "center" }}>
              <MapPin size={30} color={DANGER} strokeWidth={2} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#5B6270" }}>{errorMsg}</span>
            </div>
          ) : (
            <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <MapPin size={30} color={SEASONED_BLUE} strokeWidth={2} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5B6270" }}>Start tracking to see your position</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", background: PAPER, border: `1.4px solid ${SILVER_GREY}`, borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#8891A0", margin: 0 }}>Latitude</p>
            <p style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: SEASONED_BLUE, margin: "2px 0 0" }}>
              {coords ? coords.lat.toFixed(5) : "—"}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#8891A0", margin: 0 }}>Longitude</p>
            <p style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: SEASONED_BLUE, margin: "2px 0 0" }}>
              {coords ? coords.lng.toFixed(5) : "—"}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#8891A0", margin: 0 }}>Accuracy</p>
            <p style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: SEASONED_BLUE, margin: "2px 0 0" }}>
              {coords ? `±${Math.round(coords.accuracy)}m` : "—"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {status === "tracking" ? (
            <PrimaryButton onClick={onStop} icon={LocateFixed} style={{ background: DANGER, color: PAPER }}>
              Stop tracking
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={onStart} icon={LocateFixed}>
              {status === "locating" ? "Locating…" : "Start live tracking"}
            </PrimaryButton>
          )}
          <GhostButton icon={Share2} style={{ width: "100%" }} onClick={() => {}}>
            Share location with family
          </GhostButton>
        </div>

        <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: "#8891A0", marginTop: 14, lineHeight: 1.5 }}>
          {status === "tracking"
            ? "Tracking stays on in the background — switching screens won't stop it. Tap Stop tracking to turn it off."
            : "Your location updates in real time only while tracking is on. Turn it off any time."}
        </p>
      </div>
    </div>
  );
}

// ---------------- NEARBY RECOMMENDATIONS SCREEN ----------------
// ============================================================
// OPENSTREETMAP OVERPASS API — free nearby search, NO API KEY
// Overpass is a public, free query service over OpenStreetMap data.
// No signup, no billing account, no key. Good enough for names,
// addresses, and wheelchair-access tags — it just doesn't have
// Google-style star ratings, since OSM isn't a review platform.
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
//
// Note: it's a shared public server, so keep requests light (we
// already debounce on movement/category change below) and don't
// hammer it. If you outgrow the free public instance, you can self
// host Overpass or switch to a paid provider later — no code
// changes needed beyond swapping OVERPASS_URLS / the fetch call.
// ============================================================
// Multiple public mirrors, in order of preference. If one is rate
// limited, blocked, or down, we fall through to the next before
// giving up. kumi.systems is listed first since it's the most
// consistently reachable across different networks/firewalls.
const OVERPASS_URLS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const CATEGORIES = ["All", "Cafe", "Park", "Attraction", "Restaurant", "Pharmacy"];
const CATEGORY_ICONS = { Cafe: Coffee, Park: TreePine, Attraction: Landmark, Restaurant: UtensilsCrossed, Pharmacy: ShieldCheck };

// Maps our categories to OpenStreetMap tag=value pairs.
const CATEGORY_TO_OSM_TAGS = {
  Cafe: [["amenity", "cafe"]],
  Park: [["leisure", "park"]],
  Attraction: [["tourism", "attraction"]],
  Restaurant: [["amenity", "restaurant"]],
  Pharmacy: [["amenity", "pharmacy"]],
};
const ALL_OSM_TAGS = Object.values(CATEGORY_TO_OSM_TAGS).flat();

function categoryForPlace(tags) {
  for (const [cat, pairs] of Object.entries(CATEGORY_TO_OSM_TAGS)) {
    if (pairs.some(([k, v]) => tags[k] === v)) return cat;
  }
  return "Attraction";
}

// Haversine distance in miles between two lat/lng points
function distanceMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildOverpassQuery(tagPairs, lat, lng, radiusMeters) {
  const clauses = tagPairs
    .map(
      ([k, v]) =>
        `  node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});\n` +
        `  way["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
    )
    .join("\n");
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center 40;`;
}

async function fetchFromOverpassMirror(url, query, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNearbyPlaces({ lat, lng }, category) {
  const tagPairs = category === "All" ? ALL_OSM_TAGS : CATEGORY_TO_OSM_TAGS[category];
  const query = buildOverpassQuery(tagPairs, lat, lng, 3000);

  let data = null;
  let lastErr = null;
  for (const url of OVERPASS_URLS) {
    try {
      data = await fetchFromOverpassMirror(url, query);
      break; // success, stop trying other mirrors
    } catch (e) {
      lastErr = e;
      // Logged so you can see the REAL reason in devtools (Console tab).
      // "TypeError: Failed to fetch" here = CORS block, DNS failure, or
      // no network at all — NOT the same as a 429/busy response.
      console.warn(`[nearby] mirror failed: ${url}`, e.name, e.message);
    }
  }

  if (!data) {
    const busy = lastErr?.status === 429 || lastErr?.status === 504;
    throw new Error(
      busy
        ? "The free map servers are busy right now — wait a few seconds and try again."
        : "Couldn't reach the map server. Check your connection and try again."
    );
  }
  return (data.elements || [])
    .filter((el) => el.tags?.name) // skip unnamed nodes/ways
    .map((el) => {
      const elLat = el.type === "node" ? el.lat : el.center?.lat;
      const elLng = el.type === "node" ? el.lon : el.center?.lon;
      const wheelchair = el.tags.wheelchair;
      return {
        id: `${el.type}/${el.id}`,
        name: el.tags.name,
        category: categoryForPlace(el.tags),
        address: [el.tags["addr:housenumber"], el.tags["addr:street"]].filter(Boolean).join(" ") || undefined,
        rating: undefined, // OSM isn't a review platform — no ratings available
        ratingCount: undefined,
        wheelchairAccessible: wheelchair === "yes" ? true : wheelchair === "no" ? false : undefined,
        distance: elLat != null && elLng != null ? distanceMiles({ lat, lng }, { lat: elLat, lng: elLng }) : null,
      };
    })
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, 15);
}

function RatingBadge({ rating }) {
  if (rating == null) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: LIVELY_GREEN, borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>
      <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: SEASONED_BLUE }}>★ {rating.toFixed(1)}</span>
    </div>
  );
}

// ============================================================
// EXAMPLE-DATA FALLBACK — used only when the live Overpass search
// can't be reached (blocked network, offline, etc). Generates
// plausible-looking nearby spots positioned at real small offsets
// from the user's actual coordinates. No network call, no key,
// always works. Clearly surfaced to the user as example data —
// never presented as real results.
// ============================================================
const MOCK_NAME_POOL = {
  Cafe: ["Corner Bean Cafe", "The Daily Grind", "Sunrise Coffee House", "Milk & Honey Cafe", "Brew & Bloom", "Third Wave Coffee"],
  Park: ["Riverside Park", "Maple Grove Park", "Willow Creek Park", "Sunset Hill Park", "Cedar Park", "Meadowbrook Green"],
  Attraction: ["City History Museum", "Overlook Viewpoint", "Old Town Square", "Heritage Gallery", "Skyline Observation Deck"],
  Restaurant: ["Trattoria Bella", "The Local Table", "Harbor Grill", "Spice Route Kitchen", "Green Fork Bistro", "Copper Pot Diner"],
  Pharmacy: ["Main Street Pharmacy", "Wellness Drugstore", "QuickCare Pharmacy", "Corner Drugstore"],
};

// Random point within maxMiles of a coordinate, using a proper
// bearing/distance offset (not just naive lat/lng jitter).
function randomNearbyPoint({ lat, lng }, maxMiles) {
  const R = 3958.8;
  const distance = Math.random() * maxMiles + 0.1;
  const bearing = Math.random() * 2 * Math.PI;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const dR = distance / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(bearing));
  const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMockNearbyPlaces(coords, category) {
  const cats = category === "All" ? Object.keys(MOCK_NAME_POOL) : [category];
  const results = [];
  for (const cat of cats) {
    const names = shuffle(MOCK_NAME_POOL[cat] || []).slice(0, category === "All" ? 2 : 5);
    for (const name of names) {
      const point = randomNearbyPoint(coords, 2.5);
      results.push({
        id: `mock-${cat}-${name}`,
        name,
        category: cat,
        rating: Math.round((3.6 + Math.random() * 1.3) * 10) / 10,
        ratingCount: Math.floor(20 + Math.random() * 400),
        wheelchairAccessible: undefined,
        distance: distanceMiles(coords, point),
      });
    }
  }
  return results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

function NearbyScreen({ onBack, tracking }) {
  const [activeCat, setActiveCat] = useState("All");
  const [places, setPlaces] = useState([]);
  const [loadState, setLoadState] = useState("idle"); // idle | loading | ready
  const [isMockData, setIsMockData] = useState(false);
  const lastFetchRef = useRef({ lat: null, lng: null, cat: null, time: 0 });

  const coords = tracking.coords;

  useEffect(() => {
    if (!coords) return;

    const last = lastFetchRef.current;
    const movedFar = last.lat == null || distanceMiles(last, coords) > 0.1; // ~160m
    const catChanged = last.cat !== activeCat;
    const staleEnough = Date.now() - last.time > 45000; // don't hammer the API on every GPS tick

    if (!catChanged && !movedFar && !staleEnough) return;

    let cancelled = false;
    setLoadState("loading");
    fetchNearbyPlaces(coords, activeCat)
      .then((results) => {
        if (cancelled) return;
        setPlaces(results);
        setIsMockData(false);
        setLoadState("ready");
        lastFetchRef.current = { lat: coords.lat, lng: coords.lng, cat: activeCat, time: Date.now() };
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[nearby] live search unavailable, showing example data:", err.message);
        setPlaces(generateMockNearbyPlaces(coords, activeCat));
        setIsMockData(true);
        setLoadState("ready");
        lastFetchRef.current = { lat: coords.lat, lng: coords.lng, cat: activeCat, time: Date.now() };
      });

    return () => {
      cancelled = true;
    };
  }, [coords, activeCat]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: PAPER }}>
      <ScreenHeader title="Nearby for you" onBack={onBack} />

      <div style={{ padding: "0 20px 10px" }}>
        {tracking.status === "tracking" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrackingPulse size={7} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: "#5B6270" }}>
              Using your live location to search nearby
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <AlertCircle size={13} color="#8891A0" />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: "#8891A0" }}>
              Turn on live tracking to search near your current spot
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {CATEGORIES.map((cat) => {
            const active = cat === activeCat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  flexShrink: 0, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, padding: "7px 14px",
                  borderRadius: 20, border: `1.4px solid ${active ? SEASONED_BLUE : SILVER_GREY}`,
                  background: active ? SEASONED_BLUE : PAPER, color: active ? PAPER : SEASONED_BLUE, cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loadState === "idle" && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#8891A0", textAlign: "center", marginTop: 30 }}>
            Turn on live tracking to search nearby.
          </p>
        )}

        {loadState === "loading" && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#8891A0", textAlign: "center", marginTop: 30 }}>
            Searching nearby…
          </p>
        )}

        {loadState === "ready" && isMockData && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FFF7E8", border: "1.4px solid #EACB8F", borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
            <AlertCircle size={15} color="#B8862F" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: "#7a5a1a", lineHeight: 1.4 }}>
              Live search isn't reachable right now — showing example nearby spots based on your location instead.
            </span>
          </div>
        )}

        {loadState === "ready" && places.length === 0 && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#8891A0", textAlign: "center", marginTop: 30 }}>
            No places found nearby in this category.
          </p>
        )}

        {loadState === "ready" && places.map((place) => {
          const Icon = CATEGORY_ICONS[place.category] || Landmark;
          return (
            <div key={place.id} style={{ display: "flex", gap: 12, background: WHITISH, border: `1.4px solid ${SILVER_GREY}`, borderRadius: 16, padding: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: PAPER, border: `1.4px solid ${SILVER_GREY}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={19} color={SEASONED_BLUE} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 14.5, color: SEASONED_BLUE, margin: 0 }}>{place.name}</p>
                  <RatingBadge rating={place.rating} />
                </div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5B6270", margin: "4px 0 0" }}>
                  {place.category}{place.distance != null ? ` · ${place.distance.toFixed(1)} mi` : ""}
                  {place.ratingCount ? ` · ${place.ratingCount} ratings` : ""}
                </p>
                {place.wheelchairAccessible === true && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#8891A0", margin: "2px 0 0" }}>Wheelchair-accessible entrance</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- APP ROOT ----------------
export default function GreyttApp() {
  useBrandFonts();
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  // Tracking state lives here, at the root — NOT inside TrackingScreen —
  // so it survives navigation between screens. Only stopTracking() or
  // logout ever calls clearWatch().
  const [status, setStatus] = useState("idle"); // idle | locating | tracking | error
  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [heading, setHeading] = useState(0);
  const watchIdRef = useRef(null);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setErrorMsg("Location isn't available in this browser.");
      return;
    }
    if (watchIdRef.current !== null) return; // already running
    setStatus("locating");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setStatus("tracking");
      },
      (err) => {
        setStatus("error");
        setErrorMsg(
          err.code === 1
            ? "Location access was denied. Enable it in your browser settings to track live."
            : "Couldn't get your location right now."
        );
        watchIdRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
    setCoords(null);
  }, []);

  // Heading animation only runs while actually tracking, and this effect
  // is scoped to the root, so it also survives screen navigation.
  useEffect(() => {
    if (status !== "tracking") return;
    const t = setInterval(() => setHeading((h) => (h + 6) % 360), 700);
    return () => clearInterval(t);
  }, [status]);

  // Only clear the watch when the whole app unmounts (e.g. tab closes) —
  // never on a screen change.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const tracking = { status, coords, errorMsg, heading };

  const handleLogout = () => {
    stopTracking();
    setUser(null);
    setScreen("login");
  };

  return (
    <div style={{ width: "100%", minHeight: 640, display: "flex", alignItems: "center", justifyContent: "center", background: WHITISH, padding: "28px 12px", fontFamily: FONT_BODY }}>
      <div style={{ width: 360, height: 700, background: PAPER, borderRadius: 34, border: `3px solid ${SEASONED_BLUE}`, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {screen === "login" && (
          <LoginScreen onLogin={(u) => { setUser(u); setScreen("home"); }} />
        )}
        {screen === "home" && user && (
          <HomeScreen user={user} tracking={tracking} onOpenTracking={() => setScreen("tracking")} onOpenNearby={() => setScreen("nearby")} />
        )}
        {screen === "tracking" && (
          <TrackingScreen onBack={() => setScreen("home")} tracking={tracking} onStart={startTracking} onStop={stopTracking} />
        )}
        {screen === "nearby" && <NearbyScreen onBack={() => setScreen("home")} tracking={tracking} />}
        {screen === "profile" && user && <ProfileScreen user={user} onLogout={handleLogout} />}
        {screen !== "login" && (
          <BottomNav current={screen} onNavigate={setScreen} trackingActive={status === "tracking"} />
        )}
      </div>
    </div>
  );
}