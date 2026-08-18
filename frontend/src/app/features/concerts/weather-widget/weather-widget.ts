import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ConcertWeather } from '../../../core/models/concert.model';
import { shouldShowWeatherWidget, weatherEmptyMessage } from './weather-widget.visibility';

@Component({
  selector: 'app-weather-widget',
  imports: [DecimalPipe],
  templateUrl: './weather-widget.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWidget {
  /** Forecast payload from GET /concerts/:id/weather; null hides the widget. */
  readonly weather = input<ConcertWeather | null>(null);

  protected readonly visible = computed(() => shouldShowWeatherWidget(this.weather()));
  protected readonly emptyMessage = computed(() => {
    const weather = this.weather();
    return weather && !weather.available ? weatherEmptyMessage(weather) : '';
  });
}
