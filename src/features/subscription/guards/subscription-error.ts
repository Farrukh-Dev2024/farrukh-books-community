export function subscriptionError(message: string): never {
  throw new Error(message)
}
