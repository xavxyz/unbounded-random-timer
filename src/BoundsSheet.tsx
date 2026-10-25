import { BottomSheet, Column, Picker, Row, Text } from '@expo/ui';
import type { Bounds } from './phase';
import { BOUNDS_STEP_SECONDS, LONGEST_BOUND_SECONDS, SHORTEST_BOUND_SECONDS, formatDuration } from './setup';

// Every duration a bound can take: 0:05, 0:10, … 59:55.
const DURATIONS = Array.from(
  { length: (LONGEST_BOUND_SECONDS - SHORTEST_BOUND_SECONDS) / BOUNDS_STEP_SECONDS + 1 },
  (_, index) => SHORTEST_BOUND_SECONDS + index * BOUNDS_STEP_SECONDS,
);

type Props = {
  /** The bounds of the phase being set, or null when the sheet is closed. */
  bounds: Bounds | null;
  onChange: (change: Partial<Bounds>) => void;
  onClose: () => void;
};

/**
 * A native sheet with a wheel for a phase's shortest duration and one for its
 * longest. It keeps the system's colours so the wheels stay legible. Every
 * change goes through the setup's rules, so the wheels never show a shortest
 * above the longest.
 */
export function BoundsSheet({ bounds, onChange, onClose }: Props) {
  return (
    <BottomSheet isPresented={bounds != null} onDismiss={onClose}>
      {bounds && (
        <Row style={{ width: '100%', paddingBottom: 24 }}>
          <BoundWheel
            label="shortest"
            seconds={bounds.minSeconds}
            onChange={(minSeconds) => onChange({ minSeconds })}
          />
          <BoundWheel
            label="longest"
            seconds={bounds.maxSeconds}
            onChange={(maxSeconds) => onChange({ maxSeconds })}
          />
        </Row>
      )}
    </BottomSheet>
  );
}

function BoundWheel({
  label,
  seconds,
  onChange,
}: {
  label: string;
  seconds: number;
  onChange: (seconds: number) => void;
}) {
  return (
    <Column spacing={4} alignment="center" style={{ width: '50%' }}>
      <Text textStyle={{ fontSize: 13, fontWeight: '300', letterSpacing: 2 }}>{label}</Text>
      <Picker selectedValue={seconds} onValueChange={onChange} appearance="wheel">
        {DURATIONS.map((duration) => (
          <Picker.Item key={duration} label={formatDuration(duration)} value={duration} />
        ))}
      </Picker>
    </Column>
  );
}
