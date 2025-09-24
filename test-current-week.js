// Test current NFL week calculation
function getCurrentNFLWeek() {
  const now = new Date();
  const year = now.getFullYear();
  
  // NFL season typically starts first Thursday after Labor Day (first Monday in September)
  // For 2024 season, Week 1 started September 5, 2024
  const season2024Start = new Date('2024-09-05');
  const season2025Start = new Date('2025-09-04'); // Estimated
  
  let seasonStart;
  let season;
  
  if (now >= season2025Start) {
    seasonStart = season2025Start;
    season = 2025;
  } else if (now >= season2024Start) {
    seasonStart = season2024Start;
    season = 2024;
  } else {
    // Default to previous season
    seasonStart = new Date('2023-09-07');
    season = 2023;
  }
  
  // Calculate weeks since season start
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / msPerWeek);
  
  // NFL has 18 weeks in regular season, then playoffs
  const week = Math.min(Math.max(weeksSinceStart + 1, 1), 18);
  
  return { week, season };
}

const currentWeek = getCurrentNFLWeek();
console.log('Current date:', new Date().toLocaleDateString());
console.log('Calculated current NFL week:', currentWeek);