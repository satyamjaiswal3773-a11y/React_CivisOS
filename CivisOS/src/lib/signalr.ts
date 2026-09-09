import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { authStorage } from './authStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export function createHub(path: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${baseURL}${path}`, {
      accessTokenFactory: () => authStorage.getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
}
