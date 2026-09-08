import { stopPreview } from './preview-server';

export default function globalTeardown(): void {
  stopPreview();
}
