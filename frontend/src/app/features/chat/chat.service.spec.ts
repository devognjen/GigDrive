import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ChatMessage } from '../../core/models/chat-message.model';
import { AuthService } from '../../core/services/auth.service';
import { ChatService, SOCKET_FACTORY } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpTesting: HttpTestingController;
  let authService: { getToken: ReturnType<typeof vi.fn> };
  let socketFactory: ReturnType<typeof vi.fn>;

  const mockMessage: ChatMessage = {
    id: 'm1',
    tripId: 't1',
    authorId: 'd1',
    authorName: 'Demo Driver',
    body: 'Hello crew',
    sentAt: '2026-08-01T12:00:00.000Z',
  };

  beforeEach(() => {
    authService = { getToken: vi.fn().mockReturnValue('jwt-token') };
    socketFactory = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: SOCKET_FACTORY, useValue: socketFactory },
      ],
    });
    service = TestBed.inject(ChatService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads trip message history', () => {
    service.getMessages('t1').subscribe();
    const req = httpTesting.expectOne('/api/trips/t1/messages');
    expect(req.request.method).toBe('GET');
    req.flush([mockMessage]);
  });

  it('connects to the trip room and forwards live messages', () => {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const socket = {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        handlers[event] = cb;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
    };
    socketFactory.mockReturnValue(socket);

    const received: ChatMessage[] = [];
    const sub = service.connect('t1').subscribe((message) => received.push(message));

    expect(socketFactory).toHaveBeenCalledWith('/chat', {
      path: '/api/socket.io',
      auth: { token: 'jwt-token' },
    });
    handlers['connect']?.();
    expect(socket.emit).toHaveBeenCalledWith('join', { tripId: 't1' });

    handlers['message']?.(mockMessage);
    expect(received).toEqual([mockMessage]);

    service.send('Hello crew');
    expect(socket.emit).toHaveBeenCalledWith('message', { body: 'Hello crew' });

    sub.unsubscribe();
    expect(socket.disconnect).toHaveBeenCalled();
  });
});
