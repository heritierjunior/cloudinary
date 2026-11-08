const CLOUD_NAME = "zodnyfht";

const photos = [
  {
    file: "IMG_0587.jpg",
    publicId: "portfolio/portrait-duo",
    title: "L’élégance à deux",
    description: "Portrait en studio · Lumière douce",
    category: "portrait"
  },
  {
    file: "me.jpeg",
    publicId: "portfolio/portrait-regard",
    title: "Un regard, une histoire",
    description: "Portrait · Lumière naturelle",
    category: "portrait"
  },
  {
    file: "nelson.jpeg",
    publicId: "ortfolio/portrait-elegance",
    title: "L’élégance du quotidien",
    description: "Portrait · Goma",
    category: "portrait"
  },
  {
    file: ".trashed-1786224259-IMG-20260709-WA0555.jpg",
    publicId: "portfolio/portrait-urbain",
    title: "La ville en toile de fond",
    description: "Portrait urbain · Goma",
    category: "urbain"
  }
];

const gallery = document.querySelector("#gallery-grid");
const count = document.querySelector("#gallery-count");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-title");
const lightboxDescription = document.querySelector(".lightbox-description");
let visiblePhotos = [...photos];
let activePhotoIndex = 0;

function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME);
}

function imageUrl(photo, width, forLightbox = false) {
  if (!isCloudinaryConfigured()) {
    return encodeURI(photo.file);
  }

  const transformations = forLightbox
    ? `f_auto,q_auto,w_${width},c_limit`
    : `f_auto,q_auto,w_${width},c_fill,g_auto,ar_4:5`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${photo.publicId}`;
}

function imageSrcSet(photo) {
  if (!isCloudinaryConfigured()) {
    return encodeURI(photo.file);
  }

  return [320, 480, 720, 960]
    .map((width) => `${imageUrl(photo, width)} ${width}w`)
    .join(", ");
}

function renderGallery(filter = "all") {
  visiblePhotos = photos.filter((photo) => filter === "all" || photo.category === filter);
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
    card.append(button);
    gallery.append(card);
  }

  count.textContent = `${String(visiblePhotos.length).padStart(2, "0")} PHOTOS`;
}

function openLightbox(index) {
  activePhotoIndex = index;
  updateLightbox();
  lightbox.showModal();
}

function updateLightbox() {
  const photo = visiblePhotos[activePhotoIndex];
  lightboxImage.src = imageUrl(photo, 1800, true);
  lightboxImage.alt = `${photo.title} — ${photo.description}`;
  lightboxTitle.textContent = photo.title;
  lightboxDescription.textContent = photo.description;
}

function changePhoto(direction) {
  activePhotoIndex = (activePhotoIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  updateLightbox();
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-button.is-active")?.classList.remove("is-active");
    document.querySelector(".filter-button[aria-pressed='true']")?.setAttribute("aria-pressed", "false");
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");
    renderGallery(button.dataset.filter);
  });
});

document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
document.querySelector(".lightbox-previous").addEventListener("click", () => changePhoto(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => changePhoto(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") changePhoto(1);
  if (event.key === "ArrowLeft") changePhoto(-1);
});
document.querySelector("#current-year").textContent = new Date().getFullYear();

renderGallery();
