const CLOUD_NAME = "zodnyfht";
const FAVORITES_KEY = "portfolioFavorites";

const photos = [
  {
    publicId: "portfolio/portrait-duo",
    title: "L’élégance à deux",
    description: "Portrait en studio · Lumière douce",
    category: "portrait",
    uploadedAt: 1794139869
  },
  {
    publicId: "portfolio/portrait-regard",
    title: "Un regard, une histoire",
    description: "Portrait · Lumière naturelle",
    category: "portrait",
    uploadedAt: 1794139925
  },
  {
    publicId: "ortfolio/portrait-elegance",
    title: "L’élégance du quotidien",
    description: "Portrait · Goma",
    category: "portrait",
    uploadedAt: 1794139937
  },
  {
    publicId: "portfolio/portrait-urbain",
    title: "La ville en toile de fond",
    description: "Portrait urbain · Goma",
    category: "urbain",
    uploadedAt: 1794139952
  }
];

const gallery = document.querySelector("#gallery-grid");
const count = document.querySelector("#gallery-count");
const searchInput = document.querySelector("#photo-search");
const sortSelect = document.querySelector("#photo-sort");
const favoritesFilter = document.querySelector("#favorites-filter");
const favoritesCount = document.querySelector("#favorites-count");
const galleryFeedback = document.querySelector("#gallery-feedback");
const actionFeedback = document.querySelector("#action-feedback");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-title");
const lightboxDescription = document.querySelector(".lightbox-description");
let visiblePhotos = [...photos];
let activePhotoIndex = 0;
let activeFilter = "all";
let favoritesOnly = false;
let favorites = loadFavorites();

function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME);
}

function imageUrl(photo, width, forLightbox = false) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Le cloud name Cloudinary n’est pas configuré.");
  }

  const transformations = forLightbox
    ? `f_auto,q_auto,w_${width},c_limit`
    : `f_auto,q_auto,w_${width},c_fill,g_auto,ar_4:5`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${photo.publicId}`;
}

function imageSrcSet(photo) {
  return [320, 480, 720, 960]
    .map((width) => `${imageUrl(photo, width)} ${width}w`)
    .join(", ");
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (Array.isArray(saved) && saved.every((id) => typeof id === "string")) {
      return new Set(saved);
    }
    throw new Error("Le format des favoris enregistrés n’est pas valide.");
  } catch (error) {
    console.error("Impossible de lire les favoris locaux.", error);
    actionFeedback.textContent = "Les favoris enregistrés n’ont pas pu être lus sur cet appareil.";
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch (error) {
    console.error("Impossible d’enregistrer les favoris locaux.", error);
    actionFeedback.textContent = "Le navigateur n’a pas pu enregistrer tes favoris sur cet appareil.";
  }
}

function updateFavoritesCount() {
  favoritesCount.textContent = String(favorites.size).padStart(2, "0");
}

function getFilteredPhotos() {
  const query = searchInput.value.trim().toLocaleLowerCase("fr");
  return photos
    .filter((photo) => activeFilter === "all" || photo.category === activeFilter)
    .filter((photo) => !favoritesOnly || favorites.has(photo.publicId))
    .filter((photo) => {
      const searchableText = `${photo.title} ${photo.description} ${photo.category}`.toLocaleLowerCase("fr");
      return searchableText.includes(query);
    })
    .sort((first, second) => {
      if (sortSelect.value === "title") {
        return first.title.localeCompare(second.title, "fr");
      }
      return second.uploadedAt - first.uploadedAt;
    });
}

function renderGallery() {
  visiblePhotos = getFilteredPhotos();
  gallery.replaceChildren();

  for (const [index, photo] of visiblePhotos.entries()) {
    const card = document.createElement("article");
    card.className = "photo-card";

    const button = document.createElement("button");
    button.className = "photo-button";
    button.type = "button";
    button.setAttribute("aria-label", `Ouvrir la photo : ${photo.title}`);

    const image = document.createElement("img");
    image.src = imageUrl(photo, 480);
    image.srcset = imageSrcSet(photo);
    image.sizes = "(max-width: 560px) 46vw, (max-width: 850px) 46vw, 21vw";
    image.alt = `${photo.title} — ${photo.description}`;
    image.loading = "lazy";
    image.decoding = "async";

    const meta = document.createElement("span");
    meta.className = "photo-meta";
    const title = document.createElement("span");
    title.className = "photo-title";
    title.textContent = photo.title;
    const category = document.createElement("span");
    category.className = "photo-category";
    category.textContent = photo.category;
    meta.append(title, category);
    button.append(image, meta);
    button.addEventListener("click", () => openLightbox(index));

    const actions = document.createElement("div");
    actions.className = "photo-actions";
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "photo-action favorite-button";
    favoriteButton.type = "button";
    favoriteButton.textContent = favorites.has(photo.publicId) ? "♥" : "♡";
    favoriteButton.setAttribute("aria-label", favorites.has(photo.publicId)
      ? `Retirer ${photo.title} des favoris`
      : `Ajouter ${photo.title} aux favoris`);
    favoriteButton.setAttribute("aria-pressed", String(favorites.has(photo.publicId)));
    favoriteButton.addEventListener("click", () => toggleFavorite(photo));

    const shareButton = document.createElement("button");
    shareButton.className = "photo-action share-button";
    shareButton.type = "button";
    shareButton.textContent = "↗";
    shareButton.setAttribute("aria-label", `Partager ${photo.title}`);
    shareButton.addEventListener("click", () => sharePhoto(photo));
    actions.append(favoriteButton, shareButton);
    card.append(button, actions);
    gallery.append(card);
  }

  count.textContent = `${String(visiblePhotos.length).padStart(2, "0")} ${visiblePhotos.length === 1 ? "PHOTO" : "PHOTOS"}`;
  galleryFeedback.textContent = visiblePhotos.length === 0
    ? favoritesOnly && favorites.size === 0
      ? "Tu n’as pas encore ajouté de favoris."
      : "Aucune photo ne correspond à ta recherche."
    : "";
  updateFavoritesCount();
}

function toggleFavorite(photo) {
  if (favorites.has(photo.publicId)) {
    favorites.delete(photo.publicId);
  } else {
    favorites.add(photo.publicId);
  }
  saveFavorites();
  renderGallery();
}

async function sharePhoto(photo) {
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = `photo=${encodeURIComponent(photo.publicId)}`;
  const shareData = { title: photo.title, text: photo.description, url: shareUrl.href };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      actionFeedback.textContent = `Lien de « ${photo.title} » partagé.`;
      return;
    }
    await navigator.clipboard.writeText(shareUrl.href);
    actionFeedback.textContent = `Lien de « ${photo.title} » copié.`;
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Impossible de partager ou copier le lien.", error);
    actionFeedback.textContent = "Le partage a échoué. Vérifie les autorisations du navigateur et réessaie.";
  }
}

function openLightbox(index) {
  activePhotoIndex = index;
  updateLightbox();
  lightbox.showModal();
}

function updateLightbox() {
  const photo = visiblePhotos[activePhotoIndex];
  if (!photo) return;
  lightboxImage.src = imageUrl(photo, 1800, true);
  lightboxImage.alt = `${photo.title} — ${photo.description}`;
  lightboxTitle.textContent = photo.title;
  lightboxDescription.textContent = photo.description;
}

function changePhoto(direction) {
  if (visiblePhotos.length === 0) return;
  activePhotoIndex = (activePhotoIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  updateLightbox();
}

function openSharedPhoto() {
  const match = window.location.hash.match(/^#photo=(.+)$/);
  if (!match) return;

  let sharedPublicId;
  try {
    sharedPublicId = decodeURIComponent(match[1]);
  } catch (error) {
    console.error("Le lien partagé contient un identifiant mal formé.", error);
    galleryFeedback.textContent = "Ce lien de photo est invalide.";
    return;
  }
  const filterButton = document.querySelector('.filter-button[data-filter="all"]');
  activeFilter = "all";
  favoritesOnly = false;
  searchInput.value = "";
  favoritesFilter.classList.remove("is-active");
  favoritesFilter.setAttribute("aria-pressed", "false");
  document.querySelector(".filter-button.is-active")?.classList.remove("is-active");
  filterButton.classList.add("is-active");
  filterButton.setAttribute("aria-pressed", "true");
  sortSelect.value = "recent";
  renderGallery();
  const index = visiblePhotos.findIndex((photo) => photo.publicId === sharedPublicId);
  if (index >= 0) openLightbox(index);
}

async function preparePortfolioGallery() {
  const images = [...gallery.querySelectorAll("img")];
  for (const image of images) image.loading = "eager";

  const results = await Promise.all(images.map((image) => new Promise((resolve) => {
    if (image.complete) {
      resolve(image.naturalWidth > 0);
      return;
    }
    image.addEventListener("load", () => resolve(true), { once: true });
    image.addEventListener("error", () => resolve(false), { once: true });
  })));
  return { loaded: results.filter(Boolean).length, total: results.length };
}

document.querySelectorAll(".filter-button[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-button.is-active")?.classList.remove("is-active");
    button.classList.add("is-active");
    document.querySelectorAll(".filter-button[data-filter]").forEach((filterButton) => {
      filterButton.setAttribute("aria-pressed", String(filterButton === button));
    });
    activeFilter = button.dataset.filter;
    favoritesOnly = false;
    favoritesFilter.classList.remove("is-active");
    favoritesFilter.setAttribute("aria-pressed", "false");
    renderGallery();
  });
});

favoritesFilter.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  favoritesFilter.classList.toggle("is-active", favoritesOnly);
  favoritesFilter.setAttribute("aria-pressed", String(favoritesOnly));
  if (favoritesOnly) {
    document.querySelector(".filter-button.is-active")?.classList.remove("is-active");
    document.querySelectorAll(".filter-button[data-filter]").forEach((button) => button.setAttribute("aria-pressed", "false"));
  } else {
    activeFilter = "all";
    document.querySelector('.filter-button[data-filter="all"]').classList.add("is-active");
    document.querySelector('.filter-button[data-filter="all"]').setAttribute("aria-pressed", "true");
  }
  renderGallery();
});

searchInput.addEventListener("input", renderGallery);
sortSelect.addEventListener("change", renderGallery);
document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
document.querySelector(".lightbox-previous").addEventListener("click", () => changePhoto(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => changePhoto(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") changePhoto(1);
  if (event.key === "ArrowLeft") changePhoto(-1);
});
document.querySelector("#current-year").textContent = new Date().getFullYear();

renderGallery();
window.preparePortfolioGallery = preparePortfolioGallery;
window.openSharedPortfolioPhoto = openSharedPhoto;
