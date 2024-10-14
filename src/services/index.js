import user from './user.js'

export const services = (app) => {
  app.configure(user)

  // All services will be registered here
}
