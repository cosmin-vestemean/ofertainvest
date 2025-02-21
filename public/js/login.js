import { client } from '../client.js'

export class Login {
  constructor() {
    this.loginForm = document.getElementById('loginForm')
    this.userSelect = document.getElementById('userSelect')
    this.password = document.getElementById('password')
    this.loginMessage = document.getElementById('loginMessage')
    this.container = document.querySelector('.container-fluid')
    this.loginContainer = document.getElementById('loginContainer')
    this.clientID = ''
    this.isLoading = false
    this.username = ''
    this.init()
  }

  async loadUsers() {
    try {
      const result = await client.service('getRegisteredUsers').find({})
      if (!result.success) {
        throw new Error('Failed to load users')
      }

      this.clientID = result.clientID

      if (!this.clientID) {
        throw new Error('No client ID returned')
      }

      console.log('loadUsers clientID:', this.clientID) // Add this line

      const users = result.users
      users.forEach((user) => {
        const option = document.createElement('option')
        option.value = user.REFID
        option.textContent = user.REFIDNAME
        this.userSelect.appendChild(option)
      })

      return true
    } catch (error) {
      console.error('Error loading users:', error)
      this.showMessage('Error loading users: ' + error.message, true)
      return false
    }
  }

  async validateCredentials(userId, password) {
    if (!this.clientID) {
      throw new Error('No client ID available')
    }

    if (!userId || !password) {
      throw new Error('Missing username or password')
    }

    console.log('validateCredentials clientID:', this.clientID) // Add this line

    const result = await client.service('validateUserPwd').find({
      query: {
        clientID: this.clientID,
        refid: userId,
        password: password
      }
    })

    if (!result.success) {
      throw new Error('Invalid credentials')
    }

    return result
  }

  async init() {
    const usersLoaded = await this.loadUsers()
    if (!usersLoaded) return

    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      if (this.isLoading) return

      this.isLoading = true
      this.showMessage('Logging in...')

      try {
        if (!this.clientID) {
          // Add this check
          throw new Error('Client ID not available. Please try again.')
        }

        const userId = this.userSelect.value
        const password = this.password.value

        const validateResponse  =await this.validateCredentials(userId, password)
        this.username = validateResponse.username

        this.showMessage('Login successful!')
        this.loginContainer.style.display = 'none'
        this.container.style.display = 'block'
        document.getElementById('userName').textContent = '<i class="bi bi-person-fill fs-3">' + this.username
      } catch (error) {
        console.error('Login error:', error)
        this.showMessage(error.message, true)
      } finally {
        this.isLoading = false
      }
    })
  }

  showMessage(message, isError = false) {
    this.loginMessage.textContent = message
    this.loginMessage.className = 'mt-3 text-center ' + (isError ? 'text-danger' : 'text-success')
  }
}
