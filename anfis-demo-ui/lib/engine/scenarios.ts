export const SCENARIOS = [
    {
      name: 'Combat Spike (Aggressive)',
      duration: 35,
      features: {
        enemiesHit: 25,
        damageDone: 2500,
        timeInCombat: 30,
        kills: 8,
        itemsCollected: 2,
        pickupAttempts: 2,
        timeNearInteractables: 5,
        distanceTraveled: 100,
        timeSprinting: 15,
        timeOutOfCombat: 5
      }
    },
    {
      name: 'Exploration Drift (Passive)',
      duration: 45,
      features: {
        enemiesHit: 2,
        damageDone: 150,
        timeInCombat: 5,
        kills: 0,
        itemsCollected: 5, // Moderate collection
        pickupAttempts: 8,
        timeNearInteractables: 15, // High interaction time
        distanceTraveled: 600, // High movement
        timeSprinting: 35,
        timeOutOfCombat: 40
      }
    },
    {
      name: 'Resource Hoarding (Collector)',
      duration: 40,
      features: {
        enemiesHit: 5,
        damageDone: 300,
        timeInCombat: 10,
        kills: 1,
        itemsCollected: 18, // Very High
        pickupAttempts: 22,
        timeNearInteractables: 35,
        distanceTraveled: 200, // Moderate
        timeSprinting: 10,
        timeOutOfCombat: 30
      }
    },
    {
      name: 'Balanced (Hybrid)',
      duration: 50,
      features: {
        enemiesHit: 12,
        damageDone: 1200,
        timeInCombat: 20,
        kills: 4,
        itemsCollected: 8,
        pickupAttempts: 8,
        timeNearInteractables: 15,
        distanceTraveled: 300,
        timeSprinting: 25,
        timeOutOfCombat: 30
      }
    }
  ];
