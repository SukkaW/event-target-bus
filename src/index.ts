export type SupportedEventTarget = Window | Document | HTMLElement | SVGElement | Element | VisualViewport | ShadowRoot | XMLHttpRequest | Performance | Worker | CookieStore | MediaQueryList | EventTarget;

export type EventMapFor<T extends SupportedEventTarget> = T extends Window ? WindowEventMap & {
  // TS 4.9.5 does not support `freeze` and `resume` events yet
  freeze: Event,
  resume: Event,
  // TS 4.9.5 does not define `visibilitychange` on Window (only Document)
  visibilitychange: Event
}
  : T extends Document ? DocumentEventMap
    : T extends HTMLMediaElement ? HTMLMediaElementEventMap
      : T extends HTMLElement ? HTMLElementEventMap
        : T extends SVGElement ? SVGElementEventMap
          : T extends Element ? ElementEventMap
            : T extends VisualViewport ? VisualViewportEventMap
              /**
               * ShadowRootEventMap is not yet defined in our supported TS version. Instead, use
               * GlobalEventHandlersEventMap which is more than enough as we only need to listen for events bubbling
               * through the ShadowRoot like "change" or "input"
               */
              : T extends ShadowRoot ? GlobalEventHandlersEventMap
                : T extends XMLHttpRequest ? XMLHttpRequestEventMap
                  : T extends Performance ? PerformanceEventMap
                    : T extends Worker ? WorkerEventMap
                      : T extends CookieStore ? CookieStoreEventMap
                        : T extends MediaQueryList ? MediaQueryListEventMap
                          : T extends PermissionStatus ? PermissionStatusEventMap
                            : T extends ScreenOrientation ? ScreenOrientationEventMap
                              : T extends EventTarget ? Record<string, Event>
                                : Record<never, never>;

export type EventTargetListener<E = Event> = (event: E) => void;

export interface EventTargetBus<T extends SupportedEventTarget, K extends keyof EventMapFor<T>> {
  /** subscribe */
  on(callback: EventTargetListener<EventMapFor<T>[K]>): VoidFunction,
  /** unsubscribe */
  off(callback: EventTargetListener<EventMapFor<T>[K]>): void
}

export function createEventTargetBus<T extends SupportedEventTarget = SupportedEventTarget, K extends keyof EventMapFor<T> = keyof EventMapFor<T>>(
  target: T,
  eventName: K
): EventTargetBus<T, K> {
  const subscribers = new Set<EventTargetListener<EventMapFor<T>[K]>>();

  const dispatch = (event: Event) => {
    subscribers.forEach(cb => cb(event as EventMapFor<T>[K]));
  };

  let isListening = false;

  const off = (callback: EventTargetListener<EventMapFor<T>[K]>) => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      target.removeEventListener(eventName as string, dispatch);
      isListening = false;
    }
  };

  return {
    on(callback: EventTargetListener<EventMapFor<T>[K]>) {
      subscribers.add(callback);
      if (!isListening) {
        target.addEventListener(eventName as string, dispatch);
        isListening = true;
      }
      return () => off(callback);
    },
    off
  };
}
