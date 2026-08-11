import { describe, it } from 'mocha';
import {
  createKeyedSyncExternalStoreSubscribe,
  createSyncExternalStoreSubscribe
} from '../src/react';

import sinon from 'sinon';

import { expect } from 'earl';

describe('event-target-bus/react', () => {
  it('should subscribe to a single event name', () => {
    const eventTarget = new EventTarget();
    const callback = sinon.spy();
    const subscribe = createSyncExternalStoreSubscribe(
      () => eventTarget,
      'change'
    );

    const unsubscribe = subscribe(callback);
    eventTarget.dispatchEvent(new Event('change'));

    expect(callback.callCount).toEqual(1);

    unsubscribe();
  });

  it('should lazily create and reuse event target buses', () => {
    const eventTarget = new EventTarget();
    const getTarget = sinon.spy(() => eventTarget);
    const addEventListenerSpy = sinon.spy(eventTarget, 'addEventListener');
    const removeEventListenerSpy = sinon.spy(eventTarget, 'removeEventListener');

    const subscribe = createSyncExternalStoreSubscribe(
      getTarget,
      ['online', 'offline', 'online']
    );

    expect(getTarget.callCount).toEqual(0);

    const callback1 = sinon.spy();
    const unsubscribe1 = subscribe(callback1);

    expect(getTarget.callCount).toEqual(1);
    expect(addEventListenerSpy.callCount).toEqual(2);
    expect(addEventListenerSpy.firstCall.args[0]).toEqual('online');
    expect(addEventListenerSpy.secondCall.args[0]).toEqual('offline');

    const callback2 = sinon.spy();
    const unsubscribe2 = subscribe(callback2);

    expect(getTarget.callCount).toEqual(1);
    expect(addEventListenerSpy.callCount).toEqual(2);

    eventTarget.dispatchEvent(new Event('online'));
    eventTarget.dispatchEvent(new Event('offline'));

    expect(callback1.callCount).toEqual(2);
    expect(callback2.callCount).toEqual(2);

    unsubscribe1();
    unsubscribe1();

    expect(removeEventListenerSpy.callCount).toEqual(0);

    eventTarget.dispatchEvent(new Event('online'));

    expect(callback1.callCount).toEqual(2);
    expect(callback2.callCount).toEqual(3);

    unsubscribe2();

    expect(removeEventListenerSpy.callCount).toEqual(2);

    const callback3 = sinon.spy();
    const unsubscribe3 = subscribe(callback3);

    expect(getTarget.callCount).toEqual(1);
    expect(addEventListenerSpy.callCount).toEqual(4);

    eventTarget.dispatchEvent(new Event('offline'));
    expect(callback3.callCount).toEqual(1);

    unsubscribe3();
    expect(removeEventListenerSpy.callCount).toEqual(4);
  });

  it('should lazily create and reuse subscribe functions by key', () => {
    const eventTargets = new Map([
      ['small', new EventTarget()],
      ['large', new EventTarget()]
    ]);
    const getTarget = sinon.spy((key: string) => eventTargets.get(key)!);
    const getSubscribe = createKeyedSyncExternalStoreSubscribe(
      getTarget,
      'change'
    );

    const subscribeToSmall = getSubscribe('small');

    expect(getTarget.callCount).toEqual(0);
    expect(getSubscribe('small')).toEqual(subscribeToSmall);

    const smallCallback1 = sinon.spy();
    const unsubscribeSmall1 = subscribeToSmall(smallCallback1);

    expect(getTarget.callCount).toEqual(1);
    expect(getTarget.firstCall.args[0]).toEqual('small');

    const smallCallback2 = sinon.spy();
    const unsubscribeSmall2 = getSubscribe('small')(smallCallback2);

    expect(getTarget.callCount).toEqual(1);

    const largeCallback = sinon.spy();
    const unsubscribeLarge = getSubscribe('large')(largeCallback);

    expect(getTarget.callCount).toEqual(2);
    expect(getTarget.secondCall.args[0]).toEqual('large');

    eventTargets.get('small')!.dispatchEvent(new Event('change'));

    expect(smallCallback1.callCount).toEqual(1);
    expect(smallCallback2.callCount).toEqual(1);
    expect(largeCallback.callCount).toEqual(0);

    eventTargets.get('large')!.dispatchEvent(new Event('change'));

    expect(smallCallback1.callCount).toEqual(1);
    expect(smallCallback2.callCount).toEqual(1);
    expect(largeCallback.callCount).toEqual(1);

    unsubscribeSmall1();
    unsubscribeSmall2();
    unsubscribeLarge();
  });
});
