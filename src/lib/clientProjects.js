const PROJECT_PHOTO_VERSION = "20261004";

function createPhotos(slug, projectName, dimensions) {
  return dimensions.map(([width, height], index) => {
    const number = String(index + 1).padStart(2, "0");
    const basePath = `/client-projects/${slug}/${slug}-${number}`;

    return {
      src: `${basePath}.webp?v=${PROJECT_PHOTO_VERSION}`,
      thumbnail: `${basePath}-thumb.webp?v=${PROJECT_PHOTO_VERSION}`,
      alt: `${projectName} construction project, photo ${index + 1} of ${dimensions.length}`,
      width,
      height,
    };
  });
}

export const CLIENT_PROJECTS = {
  kap: {
    id: "kap",
    name: "KAP Manufacturers",
    photos: [],
  },
  rocell: {
    id: "rocell",
    name: "Rocell",
    photos: createPhotos("rocell", "Rocell", [
      [1604, 877],
      [1604, 730],
      [1600, 817],
      [1600, 868],
    ]),
  },
  spaCeylon: {
    id: "spa-ceylon",
    name: "Spa Ceylon",
    photos: createPhotos("spa-ceylon", "Spa Ceylon", [
      [2048, 1366],
      [2048, 1366],
      [2048, 1366],
      [2048, 1152],
    ]),
  },
  spaceLogistics: {
    id: "space-logistics",
    name: "Space Logistics",
    photos: createPhotos("space-logistics", "Space Logistics", [
      [2048, 1152],
      [2048, 1152],
      [2048, 1152],
      [2048, 1152],
      [2048, 1153],
    ]),
  },
  tvs: {
    id: "tvs",
    name: "TVS Lanka",
    photos: createPhotos("tvs", "TVS Lanka", [
      [2400, 1674],
      [2400, 1751],
      [2400, 1661],
      [2400, 1679],
    ]),
  },
};
