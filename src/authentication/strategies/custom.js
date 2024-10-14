const { Strategy } = require('@feathersjs/authentication')
const axios = require('axios')

class CustomStrategy extends Strategy {
  async authenticate(authentication, params) {
    const { email, password } = authentication

    // Call your API to validate user
    const response = await axios.post('https://your-api-endpoint', { email, password })

    if (response.data.isValid) {
      const user = response.data.user // Extract user details from the API response
      return {
        authentication: { strategy: 'custom' },
        user
      }
    } else {
      throw new Error('Invalid login')
    }
  }
}

module.exports = CustomStrategy
