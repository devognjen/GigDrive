import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';

import { TripStop } from '../../../core/models/trip.model';
import { MapMarker, toMapMarkers } from './pickup-map.markers';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

@Component({
  selector: 'app-pickup-map',
  templateUrl: './pickup-map.html',
  styleUrl: './pickup-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PickupMap {
  /** Pickup stops for the current trip; only those with coordinates are plotted. */
  readonly stops = input<TripStop[]>([]);

  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('map');
  private readonly destroyRef = inject(DestroyRef);

  protected readonly markers = computed(() => toMapMarkers(this.stops()));

  private map: L.Map | null = null;

  constructor() {
    effect(() => {
      const markers = this.markers();
      const el = this.mapEl();
      untracked(() => this.syncMap(el?.nativeElement ?? null, markers));
    });

    this.destroyRef.onDestroy(() => this.destroyMap());
  }

  private syncMap(el: HTMLDivElement | null, markers: MapMarker[]): void {
    if (!el || markers.length === 0) {
      this.destroyMap();
      return;
    }
    this.renderMap(el, markers);
  }

  private renderMap(el: HTMLDivElement, markers: MapMarker[]): void {
    this.destroyMap();
    try {
      this.map = L.map(el, { scrollWheelZoom: true });
      L.tileLayer(OSM_TILE_URL, {
        maxZoom: 19,
        attribution: OSM_ATTRIBUTION,
      }).addTo(this.map);

      const latLngs: L.LatLngExpression[] = markers.map((marker) => [marker.lat, marker.lng]);
      for (const marker of markers) {
        L.marker([marker.lat, marker.lng], {
          icon: numberedIcon(marker.seq),
          title: marker.place,
        })
          .bindPopup(marker.place)
          .addTo(this.map);
      }

      if (latLngs.length === 1) {
        this.map.setView(latLngs[0], 13);
      } else {
        this.map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 13 });
      }

      queueMicrotask(() => this.map?.invalidateSize());
    } catch {
      this.destroyMap();
    }
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = null;
  }
}

function numberedIcon(seq: number): L.DivIcon {
  return L.divIcon({
    className: 'pickup-marker',
    html: `<span class="pickup-marker-badge">${seq}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
  });
}
