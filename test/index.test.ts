import { describe, it } from 'mocha';
import { createEventTargetBus } from '../src';

import sinon from 'sinon';

import { expect, mockFn } from 'earl';

describe('event-target-bus', () => {
  it('should dispatch events to subscribers', () => {
    const eventTarget = new EventTarget();
    const bus = createEventTargetBus(eventTarget, 'test');

    const callback1 = sinon.spy();
    bus.on(callback1);

    const callback2 = sinon.spy();
    bus.on(callback2);

    const callback3 = sinon.spy();
    bus.on(callback3);

    const event = new Event('test');
    eventTarget.dispatchEvent(event);

    expect(callback1.callCount).toEqual(1);
    expect(callback2.callCount).toEqual(1);
    expect(callback3.callCount).toEqual(1);
  });

  it('should only add 1 event listener to the target', () => {
    const eventTarget = new EventTarget();

    const addEventListenerSpy = sinon.spy(eventTarget, 'addEventListener');

    const bus = createEventTargetBus(eventTarget, 'test');

    const callback1 = mockFn();
    bus.on(callback1);

    const callback2 = mockFn();
    bus.on(callback2);

    const callback3 = mockFn();
    bus.on(callback3);

    expect(addEventListenerSpy.callCount).toEqual(1);
    expect(addEventListenerSpy.firstCall.args[0]).toEqual('test');
  });

  it('should remove event listener when there are no subscribers', () => {
    const eventTarget = new EventTarget();

    const addEventListenerSpy = sinon.spy(eventTarget, 'addEventListener');
    const removeEventListenerSpy = sinon.spy(eventTarget, 'removeEventListener');

    const bus = createEventTargetBus(eventTarget, 'test');

    const callback1 = mockFn();
    const off1 = bus.on(callback1);

    const callback2 = mockFn();
    const off2 = bus.on(callback2);

    const callback3 = mockFn();
    const off3 = bus.on(callback3);

    expect(addEventListenerSpy.callCount).toEqual(1);
    expect(addEventListenerSpy.firstCall.args[0]).toEqual('test');

    off1();
    expect(removeEventListenerSpy.callCount).toEqual(0);

    off2();
    expect(removeEventListenerSpy.callCount).toEqual(0);

    off3();
    expect(removeEventListenerSpy.callCount).toEqual(1);
    expect(removeEventListenerSpy.firstCall.args[0]).toEqual('test');
  });
});
