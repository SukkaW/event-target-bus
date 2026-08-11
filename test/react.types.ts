import {
  createKeyedSyncExternalStoreSubscribe,
  createSyncExternalStoreSubscribe
} from '../src/react';

createSyncExternalStoreSubscribe(
  () => window,
  ['online', 'offline']
);

createSyncExternalStoreSubscribe(
  () => document,
  'visibilitychange'
);

createSyncExternalStoreSubscribe(
  () => document,
  // @ts-expect-error -- the event name must belong to the target's event map
  ['definitely-not-a-document-event']
);

const getMediaQuerySubscribe = createKeyedSyncExternalStoreSubscribe(
  (query: string) => window.matchMedia(query),
  'change'
);

getMediaQuerySubscribe('(width >= 768px)');

createKeyedSyncExternalStoreSubscribe(
  (query: string) => window.matchMedia(query),
  // @ts-expect-error -- the event name must belong to the keyed target's event map
  'definitely-not-a-media-query-list-event'
);
