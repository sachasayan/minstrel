type StreamingCallback = (text: string) => void
type StatusCallback = (status: string) => void

class StreamingService {
  private textListeners: Set<StreamingCallback> = new Set()
  private statusListeners: Set<StatusCallback> = new Set()
  private currentText = ''
  private currentStatus = ''

  subscribeToText(callback: StreamingCallback) {
    this.textListeners.add(callback)
    return () => this.textListeners.delete(callback)
  }

  subscribeToStatus(callback: StatusCallback) {
    this.statusListeners.add(callback)
    return () => this.statusListeners.delete(callback)
  }

  updateText(text: string) {
    this.currentText = text
    this.textListeners.forEach((cb) => cb(text))
  }

  updateStatus(status: string) {
    this.currentStatus = status
    this.statusListeners.forEach((cb) => cb(status))
  }

  clear() {
    this.currentText = ''
    this.currentStatus = ''
    this.textListeners.forEach((cb) => cb(''))
    this.statusListeners.forEach((cb) => cb(''))
  }

  getCurrentText() {
    return this.currentText
  }

  getCurrentStatus() {
    return this.currentStatus
  }
}

export const streamingService = new StreamingService()
