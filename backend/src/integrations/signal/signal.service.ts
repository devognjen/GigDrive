import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const REQUEST_TIMEOUT_MS = 5000;

interface CreateGroupResponse {
  id?: string;
}

interface GroupEntry {
  id?: string;
  name?: string;
  invite_link?: string;
}

/** Result of creating a Signal group with an invite link enabled. */
export interface CreatedSignalGroup {
  id: string;
  name: string;
  inviteLink: string;
}

/**
 * Thin client for signal-cli-rest-api (bbernhard). Used only to create a
 * group and read its invite link — user phone numbers are never sent.
 *
 * Every failure mode (flag-irrelevant missing number, network, non-2xx,
 * missing invite link) is reported as `null` so callers can degrade.
 */
@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);
  private readonly number: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.number = (config.get<string>('signal.number') ?? '').trim();
    this.baseUrl = (
      config.get<string>('signal.cliUrl') ?? 'http://signal-cli:8080'
    ).replace(/\/$/, '');
  }

  /** True when a registered Signal number is configured. */
  isConfigured(): boolean {
    return this.number.length > 0;
  }

  /**
   * Creates a group named `name` with the invite link enabled and returns
   * the link. Members are omitted so no user phone numbers are collected.
   */
  async createGroupWithInvite(
    name: string,
  ): Promise<CreatedSignalGroup | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const created = await this.request<CreateGroupResponse>(this.groupsPath(), {
      method: 'POST',
      body: JSON.stringify({
        name,
        members: [],
        group_link: 'enabled',
      }),
    });
    if (!created) {
      return null;
    }
    const groupId = created.id?.trim();
    if (!groupId) {
      this.logger.warn('signal-cli create-group response had no id');
      return null;
    }

    const group = await this.request<GroupEntry>(this.groupPath(groupId));
    if (!group) {
      return null;
    }
    const inviteLink = group.invite_link?.trim();
    if (!inviteLink) {
      this.logger.warn(
        `signal-cli group ${groupId} has no invite_link; skipping`,
      );
      return null;
    }

    return {
      id: groupId,
      name: group.name?.trim() || name,
      inviteLink,
    };
  }

  private groupsPath(): string {
    return `/v1/groups/${encodeURIComponent(this.number)}`;
  }

  private groupPath(groupId: string): string {
    return `${this.groupsPath()}/${encodeURIComponent(groupId)}`;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
      if (!response.ok) {
        this.logger.warn(
          `signal-cli responded with HTTP ${response.status} for ${path}`,
        );
        return null;
      }
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(
        `signal-cli request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
