const GOOGLE_CLIENT_ID = "689157069231-bs9q0njbl6ljbfnisi8fdajgcnc68bds.apps.googleusercontent.com";
const PROFILE_KEY = "portfolioGoogleProfile";

const gate = document.querySelector("#auth-gate");
const message = document.querySelector("#auth-message");
const googleButton = document.querySelector('[data-provider="google"]');
const profileButton = document.querySelector("#profile-button");
const accountDialog = document.querySelector("#account-dialog");
const pageLoader = document.querySelector("#page-loader");
const pageLoaderMessage = document.querySelector("#page-loader-message");
let tokenClient;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function getSavedProfile() {
  try {
    const profile = JSON.parse(sessionStorage.getItem(PROFILE_KEY));
    if (profile?.email && profile?.name) return profile;
  } catch (error) {
    console.error("Impossible de lire la session de profil.", error);
  }
  sessionStorage.removeItem(PROFILE_KEY);
  return null;
}

function setAvatar(image, initials, url, name) {
  initials.textContent = name.trim().charAt(0).toUpperCase() || "?";
  initials.hidden = false;
  image.hidden = true;
  image.removeAttribute("src");

  if (!url) return;

  image.onload = () => {
    image.hidden = false;
    initials.hidden = true;
  };
  image.onerror = () => {
    image.hidden = true;
    initials.hidden = false;
  };
  image.src = url;
}

function showProfile(profile) {
  document.querySelector("#header-name").textContent = profile.name;
  setAvatar(
    document.querySelector("#header-avatar"),
    document.querySelector("#header-initials"),
    profile.picture,
    profile.name
  );
  document.querySelector("#account-name").textContent = profile.name;
  document.querySelector("#account-email").textContent = profile.email;
  document.querySelector("#account-given-name").textContent = profile.givenName || "Non indiqué";
  document.querySelector("#account-family-name").textContent = profile.familyName || "Non indiqué";
  document.querySelector("#account-email-status").textContent = profile.emailVerified
    ? "Vérifiée par Google"
    : "Non vérifiée";
  document.querySelector("#account-provider").textContent = profile.provider || "Google";
  setAvatar(
    document.querySelector("#account-avatar"),
    document.querySelector("#account-initials"),
    profile.picture,
    profile.name
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function revealPortfolio(profile) {
  showProfile(profile);
  pageLoaderMessage.textContent = "Préparation de ta galerie…";
  pageLoader.hidden = false;
  gate.hidden = true;
  document.body.classList.remove("auth-locked");

  const preparation = typeof window.preparePortfolioGallery === "function"
    ? window.preparePortfolioGallery()
    : Promise.resolve({ loaded: 0, total: 0 });
  const [images] = await Promise.all([
    Promise.race([
      preparation,
      delay(10000).then(() => ({ loaded: 0, total: 1, timedOut: true }))
    ]),
    delay(650)
  ]);

  if (images.timedOut || (images.total > 0 && images.loaded < images.total)) {
    pageLoaderMessage.textContent = images.timedOut
      ? "Le chargement des images prend plus de temps que prévu. Ouverture de la galerie…"
      : `Certaines images ne répondent pas (${images.loaded}/${images.total}). Ouverture de la galerie…`;
    await delay(1100);
  }

  pageLoader.hidden = true;
  if (typeof window.openSharedPortfolioPhoto === "function") {
    window.openSharedPortfolioPhoto();
  }
}

function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Le service de connexion Google n’a pas pu être chargé."));
    document.head.append(script);
  });
}

async function initializeGoogleSignIn() {
  if (window.location.protocol === "file:") {
    googleButton.disabled = true;
    showMessage("Lance le site depuis un serveur local ou son adresse publiée, pas en ouvrant directement le fichier.", true);
    return;
  }

  try {
    await loadGoogleIdentityServices();
    if (!window.google?.accounts?.oauth2) {
      throw new Error("Le service de connexion Google est indisponible. Vérifie ta connexion Internet.");
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: handleGoogleResponse,
      error_callback: (error) => {
        googleButton.disabled = false;
        if (error.type === "popup_closed") {
          showMessage("Connexion annulée. Tu peux réessayer quand tu veux.");
          return;
        }
        showMessage("La fenêtre Google n’a pas pu s’ouvrir. Autorise les fenêtres pop-up et réessaie.", true);
      }
    });

    googleButton.disabled = false;
    showMessage("Le sélecteur de compte Google est prêt.");
  } catch (error) {
    googleButton.disabled = true;
    showMessage(error.message, true);
  }
}

async function handleGoogleResponse(response) {
  if (response.error || !response.access_token) {
    googleButton.disabled = false;
    showMessage(`La connexion Google a échoué${response.error ? ` : ${response.error}` : "."}`, true);
    return;
  }

  googleButton.disabled = true;
  showMessage("Vérification de ton profil Google…");

  try {
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${response.access_token}` }
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error(profile.error_description || profile.error || "Impossible de récupérer le profil Google.");
    }
    if (!profile.email || profile.email_verified !== true) {
      throw new Error("Google n’a pas confirmé l’adresse e-mail de ce compte.");
    }

    const savedProfile = {
      name: profile.name || profile.email,
      email: profile.email,
      picture: profile.picture || "",
      givenName: profile.given_name || "",
      familyName: profile.family_name || "",
      emailVerified: profile.email_verified === true,
      provider: "Google"
    };
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(savedProfile));
    await revealPortfolio(savedProfile);
  } catch (error) {
    googleButton.disabled = false;
    pageLoader.hidden = true;
    showMessage(error.message, true);
  }
}

googleButton.addEventListener("click", () => {
  if (!tokenClient) return;
  googleButton.disabled = true;
  showMessage("Ouverture du sélecteur de compte Google…");
  tokenClient.requestAccessToken({ prompt: "select_account" });
});

profileButton.addEventListener("click", () => accountDialog.showModal());
document.querySelector("#account-close").addEventListener("click", () => accountDialog.close());
accountDialog.addEventListener("click", (event) => {
  if (event.target === accountDialog) accountDialog.close();
});
document.querySelector("#logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(PROFILE_KEY);
  window.location.reload();
});

const savedProfile = getSavedProfile();
if (savedProfile) {
  revealPortfolio(savedProfile);
} else {
  initializeGoogleSignIn();
}
