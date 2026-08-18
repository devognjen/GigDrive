import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChatMessage } from '../../../core/models/chat-message.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-trip-chat',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './trip-chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripChat implements OnInit, OnDestroy {
  @Input({ required: true }) tripId!: string;

  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);

  private liveSub: Subscription | null = null;

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly sendPending = signal(false);

  protected readonly body = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });

  protected readonly currentUserId = () => this.authService.currentUser()?.id ?? null;

  ngOnInit(): void {
    this.chatService.getMessages(this.tripId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load chat history.');
      },
    });
    this.liveSub = this.chatService.connect(this.tripId).subscribe({
      next: (message) => this.append(message),
      error: () => this.loadError.set('Could not connect to live chat.'),
    });
  }

  ngOnDestroy(): void {
    this.liveSub?.unsubscribe();
    this.chatService.disconnect();
  }

  protected send(): void {
    const body = this.body.value.trim();
    if (!body || this.body.invalid || this.sendPending()) {
      this.body.markAsTouched();
      return;
    }
    this.sendPending.set(true);
    this.chatService.send(body);
    this.body.setValue('');
    this.sendPending.set(false);
  }

  private append(message: ChatMessage): void {
    this.messages.update((current) => {
      if (current.some((existing) => existing.id === message.id)) {
        return current;
      }
      return [...current, message];
    });
  }
}
