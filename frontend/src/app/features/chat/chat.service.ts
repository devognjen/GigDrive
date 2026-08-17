import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { ChatMessage } from '../../core/models/chat-message.model';
import { AuthService } from '../../core/services/auth.service';

const API_BASE = '/api';

/** Factory so unit tests can supply a fake Socket.IO client. */
export const SOCKET_FACTORY = new InjectionToken<(uri: string, opts?: object) => Socket>(
  'SOCKET_FACTORY',
  {
    providedIn: 'root',
    factory: () => io,
  },
);

/**
 * REST history plus a Socket.IO client for the per-trip chat room (FR-COMM-02).
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly socketFactory = inject(SOCKET_FACTORY);
  private socket: Socket | null = null;

  getMessages(tripId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${API_BASE}/trips/${tripId}/messages`);
  }

  /**
   * Connects to the trip room and emits live messages. Unsubscribing
   * disconnects the socket.
   */
  connect(tripId: string): Observable<ChatMessage> {
    this.disconnect();
    return new Observable((subscriber) => {
      const socket = this.socketFactory('/chat', {
        path: '/api/socket.io',
        auth: { token: this.authService.getToken() },
      });
      this.socket = socket;
      socket.on('connect', () => {
        socket.emit('join', { tripId });
      });
      socket.on('message', (message: ChatMessage) => subscriber.next(message));
      socket.on('connect_error', (error: Error) => subscriber.error(error));
      return () => {
        socket.removeAllListeners();
        socket.disconnect();
        if (this.socket === socket) {
          this.socket = null;
        }
      };
    });
  }

  send(body: string): void {
    this.socket?.emit('message', { body });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }
}
