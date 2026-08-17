import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Filters for a provider-side event search. Mirrors SearchConcertsDto. */
export interface ProviderConcertQuery {
  q?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  genre?: string;
  page?: number;
}

/** Normalized concert shape as synced from the provider into the local cache. */
export interface ProviderConcert {
  externalId: string;
  artist: string;
  title: string;
  venue: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  startAt: Date;
  imageUrl: string | null;
  genre: string | null;
  ticketUrl: string | null;
}

/** Ticketmaster Discovery API music segment — restricts results to concerts. */
const MUSIC_SEGMENT_ID = 'KZFzniwnSyZfZ7v7nJ';
const REQUEST_TIMEOUT_MS = 5000;
const PAGE_SIZE = 20;

/* Minimal typing of the Ticketmaster payload; only fields we consume. */
interface TmEventSearchResponse {
  _embedded?: { events?: TmEvent[] };
}

interface TmEvent {
  id?: string;
  name?: string;
  url?: string;
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
  };
  images?: { url?: string }[];
  classifications?: { genre?: { name?: string } }[];
  _embedded?: {
    attractions?: { name?: string }[];
    venues?: {
      name?: string;
      city?: { name?: string };
      country?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
  };
}

/**
 * Thin client for the Ticketmaster Discovery API. All provider access is
 * proxied through the backend (architectural rule, PRD §10); the free tier
 * allows 2 rps / 5000 req per day, so callers must treat results as
 * cache-worthy and this client as best-effort.
 *
 * Every failure mode (missing key, network error, non-2xx, quota) is
 * reported as `null` so callers can degrade gracefully to cached data.
 */
@Injectable()
export class TicketmasterService {
  private readonly logger = new Logger(TicketmasterService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = (config.get<string>('ticketmaster.apiKey') ?? '').trim();
    this.baseUrl = config.get<string>(
      'ticketmaster.baseUrl',
      'https://app.ticketmaster.com/discovery/v2',
    );
  }

  /** True when an API key is configured; without one no request is attempted. */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Searches music events. Returns `null` when the provider is unavailable,
   * otherwise the (possibly empty) mapped result list. Events without a
   * usable id or start date are dropped.
   */
  async searchEvents(
    query: ProviderConcertQuery,
  ): Promise<ProviderConcert[] | null> {
    if (!this.isConfigured()) {
      return null;
    }
    try {
      const response = await fetch(this.buildUrl(query), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          response.status === 401
            ? 'Ticketmaster rejected the API key (HTTP 401). Use a Consumer Key from https://developer.ticketmaster.com/'
            : `Ticketmaster responded with HTTP ${response.status}`,
        );
        return null;
      }
      const payload = (await response.json()) as TmEventSearchResponse;
      const events = payload._embedded?.events ?? [];
      return events
        .map((event) => this.toProviderConcert(event))
        .filter((concert) => concert !== null);
    } catch (error) {
      this.logger.warn(
        `Ticketmaster request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private buildUrl(query: ProviderConcertQuery): string {
    const params = new URLSearchParams({
      apikey: this.apiKey,
      segmentId: MUSIC_SEGMENT_ID,
      size: String(PAGE_SIZE),
      page: String(query.page ?? 0),
      sort: 'date,asc',
    });
    if (query.q) {
      params.set('keyword', query.q);
    }
    if (query.city) {
      params.set('city', query.city);
    }
    if (query.dateFrom) {
      params.set('startDateTime', `${query.dateFrom}T00:00:00Z`);
    }
    if (query.dateTo) {
      params.set('endDateTime', `${query.dateTo}T23:59:59Z`);
    }
    if (query.genre) {
      params.set('classificationName', query.genre);
    }
    return `${this.baseUrl}/events.json?${params.toString()}`;
  }

  private toProviderConcert(event: TmEvent): ProviderConcert | null {
    const startAt = this.parseStart(event);
    if (!event.id || !event.name || !startAt) {
      return null;
    }
    const venue = event._embedded?.venues?.[0];
    const location = venue?.location;
    return {
      externalId: event.id,
      artist: event._embedded?.attractions?.[0]?.name ?? event.name,
      title: event.name,
      venue: venue?.name ?? 'TBA',
      city: venue?.city?.name ?? '',
      country: venue?.country?.name ?? '',
      lat: location?.latitude ? Number(location.latitude) : null,
      lng: location?.longitude ? Number(location.longitude) : null,
      startAt,
      imageUrl: event.images?.[0]?.url ?? null,
      genre: event.classifications?.[0]?.genre?.name ?? null,
      ticketUrl: event.url ?? null,
    };
  }

  /** Prefers the precise UTC timestamp; falls back to local date/time. */
  private parseStart(event: TmEvent): Date | null {
    const start = event.dates?.start;
    const raw =
      start?.dateTime ??
      (start?.localDate
        ? `${start.localDate}T${start.localTime ?? '00:00:00'}Z`
        : null);
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
