// Each list follows the order around the route. The original coaches 0–9
// keep their own slots and seat reservations as new runs fill the gaps.
export const expressCoaches = [0, 10, 1, 11, 2, 12, 3, 13, 4, 14];
export const cityCoaches = [5, 15, 16, 6, 17, 18, 7, 19, 20, 8, 21, 22, 9, 23, 24];
export const expressBusCount = expressCoaches.length;
export const cityBusCount = cityCoaches.length;
export const busCount = expressBusCount + cityBusCount;
