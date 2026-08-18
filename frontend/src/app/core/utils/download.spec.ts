import { buildTrip } from '../../testing/trip.fixture';
import {
  fallbackManifestFilename,
  filenameFromContentDisposition,
  triggerBrowserDownload,
} from './download';

describe('filenameFromContentDisposition', () => {
  it('reads a quoted filename', () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename="manifest-the-demo-band-novi-sad-2026-09-10.csv"',
      ),
    ).toBe('manifest-the-demo-band-novi-sad-2026-09-10.csv');
  });

  it('returns null when the header is missing', () => {
    expect(filenameFromContentDisposition(null)).toBeNull();
  });
});

describe('fallbackManifestFilename', () => {
  it('uses artist, city, and departure date', () => {
    expect(fallbackManifestFilename(buildTrip())).toBe(
      'manifest-the-demo-band-novi-sad-2026-09-10.csv',
    );
  });
});

describe('triggerBrowserDownload', () => {
  it('creates an object URL and clicks an anchor', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:manifest');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const click = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreate(tagName);
      if (tagName === 'a') {
        element.click = click;
      }
      return element;
    });

    const blob = new Blob(['csv']);
    triggerBrowserDownload(blob, 'manifest.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:manifest');
  });
});
