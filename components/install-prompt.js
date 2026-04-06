"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./install-prompt.module.css";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState("other");

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    setIsStandalone(Boolean(standalone));

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);

    if (isIphone && isSafari) {
      setPlatform("ios");
      return;
    }

    if (isAndroid) {
      setPlatform("android");
      return;
    }

    setPlatform("other");
  }, []);

  useEffect(() => {
    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (dismissed || isStandalone) {
      return false;
    }

    if (platform === "ios") {
      return true;
    }

    return platform === "android" && Boolean(deferredPrompt);
  }, [deferredPrompt, dismissed, isStandalone, platform]);

  async function installApp() {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setDismissed(true);
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <aside className={styles.banner} data-testid="install-prompt">
      <div className={styles.copy}>
        <p className={styles.kicker} data-testid="install-prompt-kicker">Instalar app</p>
        {platform === "ios" ? (
          <p className={styles.text} data-testid="install-prompt-text">
            En Safari: Compartir, luego Agregar a pantalla de inicio.
          </p>
        ) : (
          <p className={styles.text} data-testid="install-prompt-text">
            Instalala para abrirla como app y usarla mas rapido desde el telefono.
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {platform === "android" ? (
          <button className={styles.primary} onClick={installApp} data-testid="install-prompt-install">
            Instalar
          </button>
        ) : null}
        <button className={styles.secondary} onClick={() => setDismissed(true)} data-testid="install-prompt-close">
          Cerrar
        </button>
      </div>
    </aside>
  );
}
