import { createEventTargetBus } from './index';
import type { EventMapFor, EventTargetBus, SupportedEventTarget } from './index';

export interface SyncExternalStoreSubscribe {
  (onStoreChange: () => void): () => void
}

export interface SyncExternalStoreSubscribeByKey<Key> {
  (key: Key): SyncExternalStoreSubscribe
}

/**
 * Creates a React `useSyncExternalStore` compatible subscribe function.
 *
 * The target is resolved on the first subscription, so browser globals can be
 * referenced safely from a module that is also evaluated during SSR. The
 * resulting event target buses are then reused by every subscriber.
 */
export function createSyncExternalStoreSubscribe<
  T extends SupportedEventTarget,
  K extends keyof EventMapFor<T>
>(
  getTarget: () => T,
  eventName: K | K[]
): SyncExternalStoreSubscribe {
  // eslint-disable-next-line sukka/prefer-foxts-cast-array -- avoid a dependency for this small adapter
  const eventNames = Array.from(new Set(Array.isArray(eventName) ? eventName : [eventName]));
  let buses: Array<EventTargetBus<T, K>> | null = null;

  return (onStoreChange) => {
    if (buses === null) {
      const target = getTarget();
      buses = eventNames.map(name => createEventTargetBus(target, name));
    }

    const unsubscribers = buses.map(bus => bus.on(onStoreChange));
    let isSubscribed = true;

    return () => {
      if (!isSubscribed) return;

      isSubscribed = false;
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  };
}

/**
 * Creates one stable `useSyncExternalStore` subscribe function per key.
 *
 * Looking up a key does not resolve its target. Each target is created only
 * when React first subscribes to that key, then its event target buses are
 * reused by every subscriber for the same key. Keys and their subscribe
 * functions are retained for the lifetime of this keyed factory, so it should
 * be used with a bounded set of keys.
 */
export function createKeyedSyncExternalStoreSubscribe<
  Key,
  T extends SupportedEventTarget,
  K extends keyof EventMapFor<T>
>(
  getTarget: (key: Key) => T,
  eventName: K | K[]
): SyncExternalStoreSubscribeByKey<Key> {
  const subscribeByKey = new Map<Key, SyncExternalStoreSubscribe>();

  return (key) => {
    let subscribe = subscribeByKey.get(key);

    if (subscribe === undefined) {
      subscribe = createSyncExternalStoreSubscribe(
        () => getTarget(key),
        eventName
      );
      subscribeByKey.set(key, subscribe);
    }

    return subscribe;
  };
}
