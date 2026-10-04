# Project map imagery

These label-free images are cropped and resampled exports of **EOxCloudless 2016**
by EOX IT Services GmbH, containing modified Copernicus Sentinel data 2016 & 2017.
They use the **Creative Commons Attribution 4.0 International** license.

- Source: https://maps.eox.at/
- Layer: `s2cloudless_3857`
- WMS: https://tiles.maps.eox.at/wms
- License and attribution: https://cloudless.eox.at/license-non-commercial
- License deed: https://creativecommons.org/licenses/by/4.0/

The 2016 imagery has a CC BY license that permits commercial use. Later imagery
uses a different license; do not replace these with later layers without checking
the applicable terms. This imagery supplies geographic context, not current
photography of a project. The company galleries hold the supplied project photos.

All images are Web Mercator (EPSG:3857) exports. Their geographic bounds are
listed in `src/lib/projectMapImagery.js`. The nested images have different
resolutions, allowing the camera to move continuously without loading map tiles
or contacting a third-party service in visitors' browsers. Attribution is
available through the map's info control.
