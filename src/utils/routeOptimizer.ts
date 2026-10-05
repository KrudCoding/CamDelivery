/**
 * Cambodia Multi-Stop Route Optimization Engine
 * Calculates road distances and solves Traveling Salesperson Problem (TSP)
 * to suggest the most efficient sequence of stops minimizing total kilometers.
 */

export interface DeliveryStop {
  id: string;
  name: string;
  nameKm: string;
  address: string;
  lat: number;
  lng: number;
  recipientName?: string;
  recipientPhone?: string;
  packageNote?: string;
  packageNoteKm?: string;
  weightKg?: number;
  isOrigin?: boolean;
}

export interface RouteLeg {
  fromStop: DeliveryStop;
  toStop: DeliveryStop;
  distanceKm: number;
  travelMinutes: number;
  cumulativeDistanceKm: number;
  cumulativeMinutes: number;
  etaClockEn: string;
  etaClockKm: string;
}

export interface OptimizationResult {
  originalStops: DeliveryStop[];
  optimizedStops: DeliveryStop[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  savedDistanceKm: number;
  savedPercent: number;
  originalDurationMinutes: number;
  optimizedDurationMinutes: number;
  savedMinutes: number;
  legs: RouteLeg[];
  roundTrip: boolean;
}

/**
 * Calculates geodesic distance between two coordinate points with a 1.25x
 * road curvature factor calibrated for Cambodian national roads and city streets.
 */
export function calculateRoadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (lat1 === lat2 && lng1 === lng2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  // 1.25x winding factor for realistic road mileage
  const roadKm = directDistance * 1.25;
  return Math.max(0.5, Number(roadKm.toFixed(1)));
}

/**
 * Builds a distance matrix between all provided stops.
 */
export function buildDistanceMatrix(stops: DeliveryStop[]): number[][] {
  const n = stops.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateRoadDistanceKm(
          stops[i].lat,
          stops[i].lng,
          stops[j].lat,
          stops[j].lng
        );
      }
    }
  }

  return matrix;
}

/**
 * Calculates total route distance for a given ordering of stop indices.
 */
export function calculatePathDistance(
  order: number[],
  matrix: number[][],
  roundTrip: boolean
): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    total += matrix[order[i]][order[i + 1]];
  }
  if (roundTrip && order.length > 1) {
    total += matrix[order[order.length - 1]][order[0]];
  }
  return Number(total.toFixed(1));
}

/**
 * Generates all permutations of an array.
 */
function permute<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const perms = permute(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

/**
 * Solves Multi-Stop Route Optimization.
 * Always keeps the first stop (index 0) fixed as the Origin/Depot.
 * Optimizes the sequence of all subsequent delivery drops to minimize total distance.
 */
export function optimizeDeliveryRoute(
  stops: DeliveryStop[],
  roundTrip: boolean = false,
  vehicleSpeedKmH: number = 38 // default courier speed
): OptimizationResult {
  if (stops.length <= 1) {
    return {
      originalStops: stops,
      optimizedStops: stops,
      originalDistanceKm: 0,
      optimizedDistanceKm: 0,
      savedDistanceKm: 0,
      savedPercent: 0,
      originalDurationMinutes: 0,
      optimizedDurationMinutes: 0,
      savedMinutes: 0,
      legs: [],
      roundTrip,
    };
  }

  const matrix = buildDistanceMatrix(stops);
  const n = stops.length;

  // Initial sequence: [0, 1, 2, ..., n - 1]
  const initialOrder = Array.from({ length: n }, (_, i) => i);
  const originalDistance = calculatePathDistance(initialOrder, matrix, roundTrip);

  let bestOrder = [...initialOrder];
  let bestDistance = originalDistance;

  // Indices to optimize: from 1 to n - 1 (Origin at index 0 stays fixed)
  const deliveryIndices = Array.from({ length: n - 1 }, (_, i) => i + 1);

  if (deliveryIndices.length <= 7) {
    // Exact Brute Force: <= 7 delivery stops (5,040 permutations), runs in < 5ms
    const permutations = permute(deliveryIndices);
    for (const p of permutations) {
      const candidateOrder = [0, ...p];
      const dist = calculatePathDistance(candidateOrder, matrix, roundTrip);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestOrder = candidateOrder;
      }
    }
  } else {
    // Nearest Neighbor Greedy + 2-Opt Heuristic for larger stop lists
    const visited = new Set<number>([0]);
    const nnOrder = [0];
    let current = 0;

    while (nnOrder.length < n) {
      let nearest = -1;
      let minD = Infinity;

      for (let j = 1; j < n; j++) {
        if (!visited.has(j)) {
          const d = matrix[current][j];
          if (d < minD) {
            minD = d;
            nearest = j;
          }
        }
      }

      if (nearest !== -1) {
        visited.add(nearest);
        nnOrder.push(nearest);
        current = nearest;
      } else {
        break;
      }
    }

    bestOrder = nnOrder;
    bestDistance = calculatePathDistance(bestOrder, matrix, roundTrip);

    // 2-Opt Local Search Improvement
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 150) {
      improved = false;
      iterations++;
      for (let i = 1; i < n - 1; i++) {
        for (let k = i + 1; k < n; k++) {
          const newOrder = [
            ...bestOrder.slice(0, i),
            ...bestOrder.slice(i, k + 1).reverse(),
            ...bestOrder.slice(k + 1),
          ];
          const newDist = calculatePathDistance(newOrder, matrix, roundTrip);
          if (newDist < bestDistance - 0.05) {
            bestDistance = newDist;
            bestOrder = newOrder;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  const optimizedStops = bestOrder.map((idx) => stops[idx]);
  if (roundTrip) {
    // Append return to origin for display clarity
    optimizedStops.push({
      ...stops[0],
      id: `${stops[0].id}-return`,
      name: `${stops[0].name} (Return Depot)`,
      nameKm: `${stops[0].nameKm} (ត្រឡប់មកឃ្លាំងវិញ)`,
    });
  }

  const savedDistance = Math.max(0, Number((originalDistance - bestDistance).toFixed(1)));
  const savedPercent =
    originalDistance > 0 ? Number(((savedDistance / originalDistance) * 100).toFixed(1)) : 0;

  // Travel time calculations: (distance / speed) * 60 + 8 mins per delivery stop handling
  const stopHandlingBuffer = 8;
  const originalDurationMinutes = Math.round(
    (originalDistance / vehicleSpeedKmH) * 60 + (stops.length - 1) * stopHandlingBuffer
  );
  const optimizedDurationMinutes = Math.round(
    (bestDistance / vehicleSpeedKmH) * 60 + (stops.length - 1) * stopHandlingBuffer
  );
  const savedMinutes = Math.max(0, originalDurationMinutes - optimizedDurationMinutes);

  // Build Turn-by-Turn Leg Details
  const legs: RouteLeg[] = [];
  let cumDistance = 0;
  let cumMinutes = 0;
  const startTime = new Date();

  for (let i = 0; i < optimizedStops.length - 1; i++) {
    const from = optimizedStops[i];
    const to = optimizedStops[i + 1];
    const legDist = calculateRoadDistanceKm(from.lat, from.lng, to.lat, to.lng);
    const legDriveMinutes = Math.max(1, Math.round((legDist / vehicleSpeedKmH) * 60));
    const legTotalMinutes = legDriveMinutes + (i === 0 ? 0 : stopHandlingBuffer);

    cumDistance += legDist;
    cumMinutes += legTotalMinutes;

    const arrivalDate = new Date(startTime.getTime() + cumMinutes * 60 * 1000);
    const h = arrivalDate.getHours();
    const m = arrivalDate.getMinutes().toString().padStart(2, '0');
    const isPM = h >= 12;
    const displayH = h % 12 === 0 ? 12 : h % 12;

    const periodEn = isPM ? 'PM' : 'AM';
    const periodKm = isPM ? (h >= 17 ? 'ល្ងាច' : 'រសៀល') : 'ព្រឹក';

    legs.push({
      fromStop: from,
      toStop: to,
      distanceKm: Number(legDist.toFixed(1)),
      travelMinutes: legDriveMinutes,
      cumulativeDistanceKm: Number(cumDistance.toFixed(1)),
      cumulativeMinutes: cumMinutes,
      etaClockEn: `${displayH}:${m} ${periodEn}`,
      etaClockKm: `ម៉ោង ${displayH.toString().padStart(2, '0')}:${m} ${periodKm}`,
    });
  }

  return {
    originalStops: stops,
    optimizedStops,
    originalDistanceKm: originalDistance,
    optimizedDistanceKm: bestDistance,
    savedDistanceKm: savedDistance,
    savedPercent,
    originalDurationMinutes,
    optimizedDurationMinutes,
    savedMinutes,
    legs,
    roundTrip,
  };
}

/**
 * Formats route itinerary into text suitable for sharing with driver
 * via Telegram, SMS, or WhatsApp.
 */
export function formatDriverItineraryText(
  result: OptimizationResult,
  language: 'km' | 'en'
): string {
  const isKm = language === 'km';
  const header = isKm
    ? `🇰🇭 CamDelivery កាលវិភាគដឹកជញ្ជូនរៀបចំរួច (Optimized Route)`
    : `🇰🇭 CamDelivery Optimized Driver Dispatch Itinerary`;

  const stats = isKm
    ? `📍 ចំនួនចំណត៖ ${result.optimizedStops.length} ចំណត
🛣️ ចម្ងាយសរុប៖ ${result.optimizedDistanceKm} គ.ម (សន្សំបាន ${result.savedDistanceKm} គ.ម • ${result.savedPercent}%)
⏱️ រយៈពេលប៉ាន់ស្មាន៖ ~${Math.floor(result.optimizedDurationMinutes / 60)}h ${result.optimizedDurationMinutes % 60}m`
    : `📍 Total Stops: ${result.optimizedStops.length}
🛣️ Total Distance: ${result.optimizedDistanceKm} km (Saved ${result.savedDistanceKm} km • ${result.savedPercent}%)
⏱️ Total Duration: ~${Math.floor(result.optimizedDurationMinutes / 60)}h ${result.optimizedDurationMinutes % 60}m`;

  const stopsList = result.optimizedStops
    .map((stop, idx) => {
      const isStart = idx === 0;
      const leg = idx > 0 ? result.legs[idx - 1] : null;
      const title = isKm
        ? `${isStart ? '🏁 ចំណតដើម' : `📦 ចំណតទី #${idx}`}: ${stop.nameKm}`
        : `${isStart ? '🏁 Origin' : `📦 Drop #${idx}`}: ${stop.name}`;
      const address = `   🏠 ${stop.address}`;
      const recipient = stop.recipientName
        ? `   👤 ${stop.recipientName} ${stop.recipientPhone ? `(${stop.recipientPhone})` : ''}`
        : '';
      const eta = leg ? `   ⏱️ ETA: ${isKm ? leg.etaClockKm : leg.etaClockEn} (+${leg.distanceKm} km)` : '';
      const note = stop.packageNote ? `   📝 ${stop.packageNote}` : '';

      return [title, address, recipient, eta, note].filter(Boolean).join('\n');
    })
    .join('\n\n');

  return `${header}\n${stats}\n\n${stopsList}\n\n✨ Powered by CamDelivery 0% Commission Logistics`;
}
