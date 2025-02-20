import { client } from '../client.js'

export class Login {
  constructor() {
    this.loginForm = document.getElementById('loginForm')
    this.userSelect = document.getElementById('userSelect')
    this.password = document.getElementById('password')
    this.loginMessage = document.getElementById('loginMessage')
    this.container = document.querySelector('.container-fluid')
    this.loginContainer = document.getElementById('loginContainer')

    this.init()
  }

  async init() {
    const clientID = ''
    // Load users into select
    try {
      const result = await client.service('getRegisteredUsers').find({})
      clientID = result.clientID
      if (result.success) {
        const users = result.users
        users.forEach((user) => {
          const option = document.createElement('option')
          option.value = user.REFID
          option.textContent = user.REFIDNAME
          this.userSelect.appendChild(option)
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      this.showMessage('Error loading users', true)
    }

    // Add form submit handler
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const userId = this.userSelect.value
      const password = this.password.value

      if (!userId || !password) {
        this.showMessage('Please select a user and enter password', true)
        return
      }

      try {
        const result = await client.service('validateUserPwd').find({
          clientID: clientID,
          refid: userId,
          password: password
        })

        if (result.success) {
          this.showMessage('Login successful!')
          // Hide login and show main container
          this.loginContainer.style.display = 'none'
          this.container.style.display = 'block'
        } else {
          this.showMessage('Invalid credentials', true)
        }
      } catch (error) {
        console.error('Login error:', error)
        this.showMessage('Login failed', true)
      }
    })
  }

  showMessage(message, isError = false) {
    this.loginMessage.textContent = message
    this.loginMessage.className = 'mt-3 text-center ' + (isError ? 'text-danger' : 'text-success')
  }
}
