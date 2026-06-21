class AuthEventEmitter {
  listeners = [];

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(event) {
    this.listeners.forEach(callback => callback(event));
  }
}

export const authEvents = new AuthEventEmitter();