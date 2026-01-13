// Manual test script - run from browser console during development
import { tauriBridge } from './tauri-bridge'

export async function testBridge() {
  console.log('🧪 Testing Tauri Bridge...\n')
  
  // Test workday date
  console.log('1. Testing getWorkdayDate...')
  const date = await tauriBridge.getWorkdayDate()
  console.log(`   Workday date: ${date}`)
  
  // Test UUID generation
  console.log('2. Testing generateUuid...')
  const uuid = await tauriBridge.generateUuid()
  console.log(`   Generated UUID: ${uuid}`)
  
  // Test calibration
  console.log('3. Testing calibration save/load...')
  const testCal = {
    date,
    calibrationScore: 73,
    sleepHours: 7.5,
    sleepQuality: 8,
    emotionalResidue: 3,
    emotionalState: 'Focused',
    distractions: ['slack', 'email'],
    timestamp: Date.now(),
  }
  await tauriBridge.saveCalibration(testCal)
  const loadedCal = await tauriBridge.loadCalibration()
  console.log(`   Saved and loaded calibration:`, loadedCal)
  
  // Test parking lot
  console.log('4. Testing parking lot...')
  const item = await tauriBridge.addParkingLotItem('Test task from bridge')
  console.log(`   Created item:`, item)
  const items = await tauriBridge.getActiveParkingLotItems()
  console.log(`   Active items: ${items.length}`)
  
  // Test user
  console.log('5. Testing user data...')
  await tauriBridge.saveUser(undefined, undefined, 'TestOperator', 'Flow')
  const user = await tauriBridge.getUser()
  console.log(`   User:`, user)
  
  console.log('\n✅ All tests passed!')
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testBridge = testBridge
}