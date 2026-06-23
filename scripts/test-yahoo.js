// scripts/test-yahoo.js
import { yahooProfile, yahooFinancials, yahooSearch } from '../lib/yahoo.js'

async function run() {
  try {
    console.log('Testing yahooSearch("Reliance")...')
    const searchRes = await yahooSearch('Reliance')
    console.log('Search Result Count:', searchRes.count)
    console.log('First result:', searchRes.result[0])

    console.log('\nTesting yahooProfile("RELIANCE.NS")...')
    const profileRes = await yahooProfile('RELIANCE.NS')
    console.log('Profile Result:', JSON.stringify(profileRes, null, 2))

    console.log('\nTesting yahooFinancials("RELIANCE.NS")...')
    const financialsRes = await yahooFinancials('RELIANCE.NS')
    console.log('Financials Result:', JSON.stringify(financialsRes, null, 2))

  } catch (e) {
    console.error('Test failed with error:', e)
  }
}

run()
