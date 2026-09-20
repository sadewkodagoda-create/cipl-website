function createPhotos(slug, projectName, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const basePath = `/client-projects/${slug}/${slug}-${number}`;

    return {
      src: `${basePath}.webp`,
      thumbnail: `${basePath}-thumb.webp`,
      alt: `${projectName} construction project, photo ${index + 1} of ${count}`,
    };
  });
}

export const CLIENT_PROJECTS = {
  kap: {
    id: "kap",
    name: "KAP Manufacturers",
    photos: createPhotos("kap", "KAP Manufacturers", 2),
  },
  rocell: {
    id: "rocell",
    name: "Rocell",
    photos: createPhotos("rocell", "Rocell", 14),
  },
  spaCeylon: {
    id: "spa-ceylon",
    name: "Spa Ceylon",
    photos: createPhotos("spa-ceylon", "Spa Ceylon", 9),
  },
  spaceLogistics: {
    id: "space-logistics",
    name: "Space Logistics",
    photos: createPhotos("space-logistics", "Space Logistics", 7),
  },
  tvs: {
    id: "tvs",
    name: "TVS Lanka",
    photos: createPhotos("tvs", "TVS Lanka", 8),
  },
};
