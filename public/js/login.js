import { client } from '../client.js'

export class Login {
  constructor() {
    this.loginForm = document.getElementById('loginForm')
    this.userSelect = document.getElementById('userSelect')
    this.password = document.getElementById('password')
    this.loginMessage = document.getElementById('loginMessage')
    this.container = document.querySelector('.container-fluid')
    this.loginContainer = document.getElementById('loginContainer')
    this.clientID = null

    this.init()
  }

  /**
   * Initialize login components and load users
   */
  async init() {
    try {
      await this.loadUsers()
      this.setupFormHandler()
    } catch (error) {
      console.error('Login initialization failed:', error)
      this.showMessage('System error, please try again later', true)
    }
  }

  /**
   * Load available users from server
   */
  async loadUsers() {
    const result = await client.service('getRegisteredUsers').find({})
    
    if (!result.success) {
      throw new Error('Failed to load users')
    }

    console.info('Users:', result)

    this.clientID = result.clientID
    if (!this.clientID) {
      throw new Error('No client ID received') 
    }

    const users = result.users
    users.forEach(user => {
      const option = document.createElement('option')
      option.value = user.REFID
      option.textContent = user.REFIDNAME
      this.userSelect.appendChild(option)
    })
  }

  /**
   * Set up form submission handler
   */
  setupFormHandler() {
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleLogin()
    })
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const userId = this.userSelect.value
    const password = this.password.value

    if (!this.validateForm(userId, password)) {
      return
    }

    try {
      const result = await client.service('validateUserPwd').find({
        clientID: this.clientID,
        refid: userId, 
        password: password
      })

      if (result.success) {
        this.showMessage('Login successful!')
        this.loginSuccess()
      } else {
        this.showMessage('Invalid credentials', true)
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showMessage('Login failed', true)
    }
  }

  /**
   * Validate form inputs
   */
  validateForm(userId, password) {
    if (!userId || !password) {
      this.showMessage('Please select a user and enter password', true)
      return false
    }
    return true
  }

  /**
   * Handle successful login
   */
  loginSuccess() {
    this.loginContainer.style.display = 'none'
    this.container.style.display = 'block'
  }

  /**
   * Show status message to user
   */
  showMessage(message, isError = false) {
    this.loginMessage.textContent = message
    this.loginMessage.className = 'mt-3 text-center ' + (isError ? 'text-danger' : 'text-success')
  }
}
