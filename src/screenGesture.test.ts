import { createScreenGesture, HOLD_TO_STOP_MS } from './screenGesture';

function setup(running: boolean) {
  const state = { running };
  const onStart = jest.fn(() => {
    state.running = true;
  });
  const onStop = jest.fn(() => {
    state.running = false;
  });
  const onHoldBegin = jest.fn();
  const onHoldAbandoned = jest.fn();
  const gesture = createScreenGesture({
    isRunning: () => state.running,
    onStart,
    onStop,
    onHoldBegin,
    onHoldAbandoned,
  });
  return { gesture, onStart, onStop, onHoldBegin, onHoldAbandoned };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('screen gesture while idle', () => {
  it('starts a session when a tap is released', () => {
    const { gesture, onStart } = setup(false);
    gesture.pressIn();
    gesture.pressOut();
    expect(onStart).not.toHaveBeenCalled();
    gesture.tap();
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('does not start a session when the touch is cancelled rather than released', () => {
    // e.g. pulling down Control Center: the press goes out without a tap.
    const { gesture, onStart } = setup(false);
    gesture.pressIn();
    gesture.pressOut();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('starts a session even after a long press, and never stops it', () => {
    const { gesture, onStart, onStop } = setup(false);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS * 2);
    gesture.pressOut();
    gesture.tap();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('never begins a hold', () => {
    const { gesture, onHoldBegin, onHoldAbandoned } = setup(false);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    gesture.pressOut();
    gesture.tap();
    expect(onHoldBegin).not.toHaveBeenCalled();
    expect(onHoldAbandoned).not.toHaveBeenCalled();
  });
});

describe('screen gesture while running', () => {
  it('ignores a plain tap', () => {
    const { gesture, onStart, onStop } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(100);
    gesture.pressOut();
    gesture.tap();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    expect(onStart).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });

  it('stops the session once held for the full hold, without waiting for release', () => {
    const { gesture, onStop } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS - 1);
    expect(onStop).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('does not start a new session when the completed hold is released', () => {
    const { gesture, onStart, onStop } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    gesture.pressOut();
    gesture.tap();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('cancels the stop when released early, and a new hold starts from zero', () => {
    const { gesture, onStop } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS - 100);
    gesture.pressOut();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    expect(onStop).not.toHaveBeenCalled();

    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS - 1);
    expect(onStop).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('does not stop again when the session already ended during the hold', () => {
    // e.g. leaving the app mid-hold stops the session on its own.
    const state = { running: true };
    const onStop = jest.fn();
    const gesture = createScreenGesture({
      isRunning: () => state.running,
      onStart: jest.fn(),
      onStop,
      onHoldBegin: jest.fn(),
      onHoldAbandoned: jest.fn(),
    });
    gesture.pressIn();
    state.running = false;
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('drops a pending hold when cancelled, e.g. as the session ends on its own', () => {
    const { gesture, onStart, onStop } = setup(true);
    gesture.pressIn();
    gesture.cancel();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    gesture.pressOut();
    gesture.tap();
    expect(onStop).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('reports a hold beginning as soon as it is pressed', () => {
    const { gesture, onHoldBegin, onHoldAbandoned } = setup(true);
    gesture.pressIn();
    expect(onHoldBegin).toHaveBeenCalledTimes(1);
    expect(onHoldAbandoned).not.toHaveBeenCalled();
  });

  it('reports the hold abandoned when released early', () => {
    const { gesture, onStop, onHoldAbandoned } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS - 1);
    gesture.pressOut();
    expect(onHoldAbandoned).toHaveBeenCalledTimes(1);
    gesture.tap();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    expect(onHoldAbandoned).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('reports the hold abandoned when cancelled', () => {
    const { gesture, onHoldAbandoned } = setup(true);
    gesture.pressIn();
    gesture.cancel();
    expect(onHoldAbandoned).toHaveBeenCalledTimes(1);
    gesture.pressOut();
    expect(onHoldAbandoned).toHaveBeenCalledTimes(1);
  });

  it('stops a completed hold without reporting it abandoned', () => {
    const { gesture, onStop, onHoldAbandoned } = setup(true);
    gesture.pressIn();
    jest.advanceTimersByTime(HOLD_TO_STOP_MS);
    gesture.pressOut();
    gesture.tap();
    gesture.cancel();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onHoldAbandoned).not.toHaveBeenCalled();
  });

  it('begins a fresh hold each time after an early release', () => {
    const { gesture, onHoldBegin, onHoldAbandoned } = setup(true);
    gesture.pressIn();
    gesture.pressOut();
    gesture.pressIn();
    expect(onHoldBegin).toHaveBeenCalledTimes(2);
    expect(onHoldAbandoned).toHaveBeenCalledTimes(1);
  });
});
