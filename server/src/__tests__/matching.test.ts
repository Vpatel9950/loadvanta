import { describe, it, expect } from 'vitest';
import { ReturnLoadMatchingEngine } from '../modules/matching/matching.service';
import { VehicleType, CargoType, ShipmentStatus } from '@loadvanta/contracts';

describe('ReturnLoadMatchingEngine', () => {
  const engine = new ReturnLoadMatchingEngine();

  it('should score high for direct return route from truck location to home base', () => {
    // Truck is in Jalandhar, heading back to home base Ludhiana
    const mockVehicle: any = {
      _id: 'veh_1',
      registrationNumber: 'PB10CZ4521',
      vehicleType: VehicleType.HEAVY_DUTY,
      capacityTons: 16,
      currentCity: 'Jalandhar',
      supportedCargoTypes: [CargoType.TEXTILES_GARMENTS, CargoType.GENERAL_MERCHANDISE]
    };

    const mockShipment: any = {
      _id: 'ship_1',
      title: 'Fabric rolls to Ludhiana',
      pickupCity: 'Jalandhar',
      deliveryCity: 'Ludhiana',
      weightTons: 12,
      requiredVehicleType: VehicleType.HEAVY_DUTY,
      cargoType: CargoType.TEXTILES_GARMENTS,
      pickupDate: new Date(),
      status: ShipmentStatus.PUBLISHED
    };

    const breakdown = engine.calculateMatchScore(mockVehicle, mockShipment, 'Ludhiana');

    // Should score very high for route compatibility (pickup in current city + delivery to home base)
    expect(breakdown.routeCompatibilityScore).toBeGreaterThanOrEqual(30);
    expect(breakdown.capacityCompatibilityScore).toBeGreaterThanOrEqual(15);
    expect(breakdown.totalScore).toBeGreaterThanOrEqual(75);
    expect(breakdown.explanations.length).toBeGreaterThan(0);
    expect(breakdown.detourDistanceKm).toBeLessThanOrEqual(20);
  });

  it('should calculate detour and transit duration based on Punjab highway network', () => {
    const mockVehicle: any = {
      _id: 'veh_2',
      registrationNumber: 'PB10DA8899',
      vehicleType: VehicleType.LIGHT_COMMERCIAL,
      capacityTons: 6,
      currentCity: 'Ludhiana',
      supportedCargoTypes: [CargoType.SPORTS_GOODS]
    };

    const mockShipment: any = {
      _id: 'ship_2',
      title: 'Sports gear from Jalandhar to Amritsar',
      pickupCity: 'Jalandhar',
      deliveryCity: 'Amritsar',
      weightTons: 4,
      requiredVehicleType: VehicleType.LIGHT_COMMERCIAL,
      cargoType: CargoType.SPORTS_GOODS,
      pickupDate: new Date(),
      status: ShipmentStatus.PUBLISHED
    };

    const breakdown = engine.calculateMatchScore(mockVehicle, mockShipment, 'Ludhiana');

    // Highway route between Jalandhar and Amritsar is ~81km
    expect(breakdown.roadDistanceKm).toBe(81);
    expect(breakdown.estimatedTransitHours).toBeGreaterThan(1.5);
  });
});
