import { startPreview } from './preview-server';

export default async function globalSetup(): Promise<void> {
  await startPreview();
}
