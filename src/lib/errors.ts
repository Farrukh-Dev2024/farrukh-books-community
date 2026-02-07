export class InvalidLoginError extends Error {
  code: string

  constructor(errorString: string) {
    super(errorString)
    this.code = errorString
    Object.setPrototypeOf(this, InvalidLoginError.prototype)
  }
}