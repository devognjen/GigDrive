import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { ChatMessage } from '../../../core/models/chat-message.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../chat.service';
import { TripChat } from './trip-chat';

const mockMessage: ChatMessage = {
  id: 'm1',
  tripId: 't1',
  authorId: 'd1',
  authorName: 'Demo Driver',
  body: 'Hello crew',
  sentAt: '2026-08-01T12:00:00.000Z',
};

describe('TripChat', () => {
  let fixture: ComponentFixture<TripChat>;
  let component: TripChat;
  let chatService: {
    getMessages: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  const live$ = new Subject<ChatMessage>();

  beforeEach(async () => {
    chatService = {
      getMessages: vi.fn().mockReturnValue(of([mockMessage])),
      connect: vi.fn().mockReturnValue(live$.asObservable()),
      send: vi.fn(),
      disconnect: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TripChat],
      providers: [
        { provide: ChatService, useValue: chatService },
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ id: 'd1' }) as User,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripChat);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tripId', 't1');
    component.tripId = 't1';
    fixture.detectChanges();
  });

  it('renders history and appends live messages', () => {
    expect(chatService.getMessages).toHaveBeenCalledWith('t1');
    expect(chatService.connect).toHaveBeenCalledWith('t1');
    expect(fixture.nativeElement.textContent).toContain('Hello crew');

    live$.next({
      ...mockMessage,
      id: 'm2',
      body: 'On my way',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('On my way');
  });

  it('sends a trimmed message', () => {
    component['body'].setValue('  See you there  ');
    component['send']();
    expect(chatService.send).toHaveBeenCalledWith('See you there');
    expect(component['body'].value).toBe('');
  });

  it('shows an error when history fails to load', async () => {
    chatService.getMessages.mockReturnValue(throwError(() => new Error('fail')));
    const failed = TestBed.createComponent(TripChat);
    failed.componentInstance.tripId = 't1';
    failed.detectChanges();
    expect(failed.nativeElement.textContent).toContain('Could not load chat history.');
  });
});
