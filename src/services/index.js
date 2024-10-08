export {}

import { user } from './users/users.js'

export const services = (app) => {
  app.configure(user)

  app.configure(user)

  // All services will be registered here
}
