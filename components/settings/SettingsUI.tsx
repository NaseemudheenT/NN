"use client";

/**
 * Settings.
 *
 * Every control here does something. There is no decorative switch: the light
 * rows drive the showroom's lighting, the 3D row decides whether the canvas
 * mounts at all, the privacy rows decide what is recorded, and the delete rows
 * genuinely delete. A settings screen full of toggles that do nothing is worse
 * than no settings screen, because it teaches the customer not to trust the
 * ones that do.
 */

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { readConsent } from "@/components/layout/ConsentBanner";
import { toast } from "@/components/layout/Toaster";

import { Group, Row, Switch, ICONS } from "./parts";

const LANGUAGES = [
  { code: "auto", label: "Match my device" },
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी — Hindi" },
  { code: "ta", label: "தமிழ் — Tamil" },
  { code: "ml", label: "മലയാളം — Malayalam" },
  { code: "ar", label: "العربية — Arabic" },
];

const KEYS = {
  showroom3D: "nn-showroom-3d",
  measurements: "nn-measurements",
  language: "nn-language",
  intro: "nn-intro-played",
  consent: "nn-consent",
  bag: "nn-bag",
  cartId: "nn-cart-id",
};

/**
 * The showroom has no light switch, by design — it is lit by the hour where
 * the visitor is standing. This line says what the room is doing, and nothing
 * here can change it.
 */
const LIGHT_DETAIL: Record<string, string> = {
  morning: "Morning light through the windows",
  afternoon: "Full afternoon daylight",
  evening: "Golden hour across the marble",
  night: "The night lounge, gold on the garments",
};

export function SettingsUI() {
  const { phase, theme, sky, reducedMotion } = useTheme();

  const [showroom3D, setShowroom3D] = useState(true);
  const [consent, setConsent] = useState<"granted" | "declined" | null>(null);
  const [hasMeasurements, setHasMeasurements] = useState(false);
  const [language, setLanguage] = useState("auto");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    try {
      setShowroom3D(window.localStorage.getItem(KEYS.showroom3D) !== "off");
      setHasMeasurements(!!window.localStorage.getItem(KEYS.measurements));
      setLanguage(window.localStorage.getItem(KEYS.language) ?? "auto");
    } catch {
      /* private browsing: the defaults stand */
    }
    setConsent(readConsent());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const write = useCallback((key: string, value: string | null) => {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      return true;
    } catch {
      toast("This browser is not allowing settings to be saved.");
      return false;
    }
  }, []);

  const set3D = (on: boolean) => {
    setShowroom3D(on);
    write(KEYS.showroom3D, on ? "on" : "off");
    toast(on ? "The 3D showroom is on." : "The 3D showroom is off. Everything still works in 2D.");
  };

  const setConsentValue = (granted: boolean) => {
    setConsent(granted ? "granted" : "declined");
    write(KEYS.consent, granted ? "granted" : "declined");
    toast(granted ? "Thank you. We will count anonymously." : "Nothing will be recorded.");
  };

  const replayIntro = () => {
    write(KEYS.intro, null);
    toast("The opening will play next time you arrive.");
  };

  const forgetMeasurements = () => {
    write(KEYS.measurements, null);
    setHasMeasurements(false);
    toast("Your measurements have been deleted from this device.");
  };

  const forgetEverything = () => {
    Object.values(KEYS).forEach((k) => write(k, null));
    refresh();
    toast("Everything NN stored on this device has been deleted.");
  };

  const themeWord = theme === "night" ? "night" : theme === "dusk" ? "dusk" : "day";

  /* The sun's elevation is negative at night, and "−68° above the horizon" is
     not a sentence. Say below, and describe what that actually means. */
  const elevation = Math.round(sky.solar.elevation);
  const sunSentence =
    elevation >= 0
      ? `Auto follows the clock where you are. It is ${phase} for you now, so the room is lit for ${themeWord}: the sun sits ${elevation}° above your horizon and its light is about ${Math.round(
          sky.kelvin,
        )} K. Those are computed from your clock, date and longitude, not chosen from a list.`
      : `Auto follows the clock where you are. It is ${phase} for you now, so the room is lit for ${themeWord}: the sun is ${Math.abs(
          elevation,
        )}° below your horizon, and the light in the room comes from the lamps. All of it is computed from your clock, date and longitude, not chosen from a list.`;

  return (
    <div className="nn-settings">
      <Group
        title="The showroom"
        footnote={sunSentence}
      >
        <Row
          icon={ICONS.sun}
          tint="linear-gradient(160deg,#e8b87a,#c9a43a)"
          label="Light"
          detail={LIGHT_DETAIL[phase]}
        />
        <Row
          icon={ICONS.cube}
          tint="linear-gradient(160deg,#8a7b6a,#3a3a3d)"
          label="3D showroom"
          detail={showroom3D ? "Walk the room" : "Two dimensions only"}
          action={ready ? <Switch checked={showroom3D} onChange={set3D} label="3D showroom" /> : undefined}
        />
        <Row
          icon={ICONS.motion}
          tint="linear-gradient(160deg,#4f5443,#2a2d24)"
          label="Reduced motion"
          detail="Follows your system setting, and we respect it"
          value={reducedMotion ? "On" : "Off"}
        />
        <Row
          icon={ICONS.sparkle}
          tint="linear-gradient(160deg,#c9a43a,#8a6f1e)"
          label="Play the opening again"
          detail="The monogram sequence, next time you arrive"
          onClick={replayIntro}
        />
      </Group>

      <Group
        title="Language"
        footnote="The stylist answers in whichever language you write to it; this tells it which you prefer. The rest of the site is in English for now."
      >
        <Row
          icon={ICONS.globe}
          tint="linear-gradient(160deg,#5c8fb8,#25314c)"
          label="Preferred language"
          detail={LANGUAGES.find((l) => l.code === language)?.label}
          action={
            <select
              className="nn-set-select"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                write(KEYS.language, e.target.value);
                toast("The stylist will prefer that language.");
              }}
              aria-label="Preferred language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          }
        />
      </Group>

      <Group
        title="Fit"
        footnote="Measurements are held in this browser and nowhere else. They are never sent to us — not even with an order, where we receive only the size you chose."
      >
        <Row
          icon={ICONS.ruler}
          tint="linear-gradient(160deg,#b8ae9c,#8a7b6a)"
          label="Trial room"
          detail={hasMeasurements ? "Your measurements are saved on this device" : "Nothing saved yet"}
          href="/trial-room"
        />
        {hasMeasurements ? (
          <Row
            icon={ICONS.trash}
            tint="linear-gradient(160deg,#8c3b40,#5c1f24)"
            label="Forget my measurements"
            onClick={forgetMeasurements}
            destructive
          />
        ) : null}
        <Row icon={ICONS.bag} tint="linear-gradient(160deg,#4a3526,#2a1d14)" label="Your bag" href="/bag" />
      </Group>

      <Group
        title="Privacy"
        footnote="Nothing is counted until you agree, and declining changes nothing else about the site. Events carry no address and no identifier, and the time is rounded to the hour."
      >
        <Row
          icon={ICONS.chart}
          tint="linear-gradient(160deg,#6f8f5f,#4f5443)"
          label="Anonymous counting"
          detail={
            consent === "granted"
              ? "You have agreed"
              : consent === "declined"
                ? "You have declined"
                : "You have not been asked yet"
          }
          action={
            ready ? (
              <Switch
                checked={consent === "granted"}
                onChange={setConsentValue}
                label="Anonymous counting"
              />
            ) : undefined
          }
        />
        <Row
          icon={ICONS.lock}
          tint="linear-gradient(160deg,#3a3a3d,#0a0a0a)"
          label="Privacy notice"
          href="/privacy"
        />
        <Row
          icon={ICONS.trash}
          tint="linear-gradient(160deg,#8c3b40,#5c1f24)"
          label="Delete everything stored on this device"
          detail="Bag, measurements, preferences"
          onClick={forgetEverything}
          destructive
        />
      </Group>

      <Group title="Nero Noren">
        <Row icon={ICONS.info} tint="linear-gradient(160deg,#c9a43a,#8a6f1e)" label="About the house" href="/about" />
        <Row icon={ICONS.ruler} tint="linear-gradient(160deg,#b8ae9c,#6e6a63)" label="How we size" href="/sizing" />
        <Row icon={ICONS.bag} tint="linear-gradient(160deg,#4a3526,#2a1d14)" label="Delivery and returns" href="/delivery" />
        <Row icon={ICONS.lock} tint="linear-gradient(160deg,#3a3a3d,#0a0a0a)" label="Terms" href="/terms" />
      </Group>

      <p className="nn-set-footnote" style={{ textAlign: "center" }}>
        Nero Noren Private Limited · Timeless style builds character.
      </p>
    </div>
  );
}
