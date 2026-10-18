import { Shipment, IShipment } from '../../infrastructure/database/models/Shipment';
import { Vehicle, IVehicle } from '../../infrastructure/database/models/Vehicle';
import { ShipmentStatus } from '@loadvanta/contracts';
import { getRoadDistanceKm, estimateTransitDurationHours } from '../../infrastructure/maps/distanceMatrix';
import { Types } from 'mongoose';

export interface MatchScoreBreakdown {
  routeCompatibilityScore: number; // 0 - 35
  timingCompatibilityScore: number; // 0 - 25
  capacityCompatibilityScore: number; // 0 - 20
  detourEfficiencyScore: number; // 0 - 10
  priceSuitabilityScore: number; // 0 - 10
  totalScore: number; // 0 - 100
  explanations: string[];
  detourDistanceKm: number;
  roadDistanceKm: number;
  estimatedTransitHours: number;
}

export interface ScoredMatch {
  shipment: IShipment;
  vehicle: IVehicle;
  score: number;
  breakdown: MatchScoreBreakdown;
}

export class ReturnLoadMatchingEngine {
  /**
   * Find matching return loads for a transporter's vehicle or given route
   */
  async findMatchesForVehicle(
    vehicleId: string,
    transporterHomeCity?: string,
    targetPickupDate?: Date
  ): Promise<ScoredMatch[]> {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Candidate shipments: published or receiving quotations
    const candidates = await Shipment.find({
      status: { $in: [ShipmentStatus.PUBLISHED, ShipmentStatus.QUOTATION_RECEIVED] }
    }).populate('shipperId', 'fullName companyName city');

    const matches: ScoredMatch[] = [];

    for (const shipment of candidates) {
      // 1. Hard capacity check: Vehicle must have capacity >= shipment weight
      if (vehicle.capacityTons < shipment.weightTons) {
        continue;
      }

      // 2. Hard cargo compatibility check: If vehicle has specified cargo types, must include shipment's cargo
      if (
        vehicle.supportedCargoTypes &&
        vehicle.supportedCargoTypes.length > 0 &&
        !vehicle.supportedCargoTypes.includes(shipment.cargoType)
      ) {
        continue;
      }

      // 3. Compute detailed score
      const breakdown = this.calculateMatchScore(vehicle, shipment, transporterHomeCity, targetPickupDate);

      // Only consider relevant matches with score >= 40%
      if (breakdown.totalScore >= 35) {
        matches.push({
          shipment,
          vehicle,
          score: breakdown.totalScore,
          breakdown
        });
      }
    }

    // Sort descending by total score
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculates the 5-part weighted score:
   * - Route compatibility: 35%
   * - Timing compatibility: 25%
   * - Vehicle/capacity compatibility: 20%
   * - Detour efficiency: 10%
   * - Price suitability: 10%
   */
  calculateMatchScore(
    vehicle: IVehicle,
    shipment: IShipment,
    transporterHomeCity?: string,
    targetPickupDate?: Date
  ): MatchScoreBreakdown {
    const explanations: string[] = [];

    // Current truck location
    const truckCity = vehicle.currentCity || transporterHomeCity || 'Ludhiana';
    const pickupCity = shipment.pickupCity;
    const deliveryCity = shipment.deliveryCity;
    const homeBase = transporterHomeCity || vehicle.currentCity || 'Ludhiana';

    // 1. ROUTE COMPATIBILITY (35%)
    // High score if pickup is in current city, or return journey heads towards home base
    let routeScore = 0;
    const truckToPickup = getRoadDistanceKm(truckCity, pickupCity);
    const shipmentRoute = getRoadDistanceKm(pickupCity, deliveryCity);
    const deliveryToHome = getRoadDistanceKm(deliveryCity, homeBase);

    if (truckCity.toLowerCase() === pickupCity.toLowerCase()) {
      routeScore += 25; // Perfect pickup origin
      explanations.push(`Direct load from truck's current location (${truckCity})`);
    } else if (truckToPickup.distanceKm <= 50) {
      routeScore += 18;
      explanations.push(`Close pickup proximity: only ${truckToPickup.distanceKm} km from ${truckCity}`);
    } else if (truckToPickup.distanceKm <= 100) {
      routeScore += 10;
      explanations.push(`Moderate pickup distance (${truckToPickup.distanceKm} km from ${truckCity})`);
    } else {
      routeScore += 4;
    }

    // Return direction bonus: does delivery city bring truck closer to home base?
    if (deliveryCity.toLowerCase() === homeBase.toLowerCase()) {
      routeScore += 10;
      explanations.push(`Perfect return load directly back to fleet home base (${homeBase})`);
    } else if (deliveryToHome.distanceKm < 100) {
      routeScore += 6;
      explanations.push(`Return route lands near home base (${deliveryCity} is ${deliveryToHome.distanceKm} km from ${homeBase})`);
    }

    const routeCompatibilityScore = Math.min(35, routeScore);

    // 2. TIMING COMPATIBILITY (25%)
    let timingScore = 15;
    const targetDate = targetPickupDate ? new Date(targetPickupDate).getTime() : Date.now();
    const shipmentDate = new Date(shipment.pickupDate).getTime();
    const hoursDiff = Math.abs(shipmentDate - targetDate) / (1000 * 60 * 60);

    if (hoursDiff <= 24) {
      timingScore = 25;
      explanations.push('Ideal pickup schedule: aligned within 24 hours of availability');
    } else if (hoursDiff <= 48) {
      timingScore = 20;
      explanations.push('Good timing window: ready for pickup within 2 days');
    } else if (hoursDiff <= 96) {
      timingScore = 14;
    } else {
      timingScore = 8;
    }
    const timingCompatibilityScore = Math.min(25, timingScore);

    // 3. VEHICLE & CAPACITY COMPATIBILITY (20%)
    let capacityScore = 0;
    const payloadUtilization = (shipment.weightTons / vehicle.capacityTons) * 100;

    if (payloadUtilization >= 75 && payloadUtilization <= 100) {
      capacityScore += 15;
      explanations.push(`High payload efficiency: utilizes ${Math.round(payloadUtilization)}% of ${vehicle.capacityTons}T capacity`);
    } else if (payloadUtilization >= 50) {
      capacityScore += 12;
      explanations.push(`Medium payload utilization (${Math.round(payloadUtilization)}% capacity)`);
    } else {
      capacityScore += 8;
      explanations.push(`Partial load (${Math.round(payloadUtilization)}% capacity)`);
    }

    if (vehicle.vehicleType === shipment.requiredVehicleType) {
      capacityScore += 5;
      explanations.push(`Exact vehicle type match: ${shipment.requiredVehicleType}`);
    } else {
      capacityScore += 2;
    }
    const capacityCompatibilityScore = Math.min(20, capacityScore);

    // 4. DETOUR EFFICIENCY (10%)
    let detourScore = 5;
    const detourKm = truckToPickup.distanceKm;

    if (detourKm <= 20) {
      detourScore = 10;
      explanations.push('Minimal detour (< 20 km deadhead travel)');
    } else if (detourKm <= 60) {
      detourScore = 7;
      explanations.push(`Acceptable detour distance (${detourKm} km)`);
    } else {
      detourScore = 3;
    }
    const detourEfficiencyScore = Math.min(10, detourScore);

    // 5. PRICE SUITABILITY (10%)
    let priceScore = 7;
    if (shipment.targetPriceInr && shipment.targetPriceInr > 0) {
      const estimatedRatePerKm = shipment.targetPriceInr / Math.max(1, shipmentRoute.distanceKm);
      if (estimatedRatePerKm >= 50) {
        priceScore = 10;
        explanations.push(`Attractive freight rate: approx ₹${Math.round(estimatedRatePerKm)}/km`);
      } else if (estimatedRatePerKm >= 35) {
        priceScore = 8;
      } else {
        priceScore = 5;
      }
    } else {
      priceScore = 7; // Open RFQ - transporter can propose fair rate
      explanations.push('Open RFQ: Transporter can quote custom rate');
    }
    const priceSuitabilityScore = Math.min(10, priceScore);

    // Total Score
    const totalScore = Math.round(
      routeCompatibilityScore +
      timingCompatibilityScore +
      capacityCompatibilityScore +
      detourEfficiencyScore +
      priceSuitabilityScore
    );

    return {
      routeCompatibilityScore,
      timingCompatibilityScore,
      capacityCompatibilityScore,
      detourEfficiencyScore,
      priceSuitabilityScore,
      totalScore,
      explanations,
      detourDistanceKm: truckToPickup.distanceKm,
      roadDistanceKm: shipmentRoute.distanceKm,
      estimatedTransitHours: estimateTransitDurationHours(shipmentRoute.distanceKm)
    };
  }
}

export const returnLoadMatchingEngine = new ReturnLoadMatchingEngine();
