import { Fragment } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { PHASE_COLOURS } from './palette';
import type { Phase } from './sessionClock';
import { cardsOf, formatBounds, setPhaseEnabled, swapOrder, type Setup } from './setup';

type Props = { setup: Setup; onChange: (setup: Setup) => void };

/**
 * The phase cards in round order, with the swap control between them. Every
 * touch on them stays here, so it never reaches the grey that starts a session.
 */
export function SetupCards({ setup, onChange }: Props) {
  const cards = cardsOf(setup);
  return (
    <View style={styles.stack}>
      {cards.map((card, index) => {
        const { background, ink } = PHASE_COLOURS[card.phase];
        return (
          <Fragment key={card.phase}>
            {index > 0 && (
              <Pressable
                style={styles.swap}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Swap the order"
                onPress={() => onChange(swapOrder(setup))}
              >
                <Text style={styles.swapGlyph}>⇅</Text>
              </Pressable>
            )}
            {/* Claims the touch; it will open the bounds sheet in a later ticket. */}
            <Pressable
              style={[styles.card, { backgroundColor: background, opacity: card.enabled ? 1 : 0.5 }]}
              accessibilityLabel={`${card.phase} ${formatBounds(card.bounds)}`}
            >
              <Text style={[styles.bounds, { color: ink }]}>{formatBounds(card.bounds)}</Text>
              {/* The native switch handles its own touch; this wrapper keeps it from the grey. */}
              <View onStartShouldSetResponder={() => true}>
                <Switch
                  value={card.enabled}
                  disabled={!card.canTurnOff}
                  onValueChange={(enabled) => onChange(setPhaseEnabled(setup, card.phase, enabled))}
                  trackColor={{ true: TRACK_ON[card.phase] }}
                  accessibilityLabel={`${card.phase} phase`}
                />
              </View>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

// An enabled switch reads against its own card.
const TRACK_ON: Record<Phase, string> = { white: '#3A3A3A', black: '#9A9A9A' };

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'stretch',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  bounds: {
    fontSize: 28,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  swap: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  swapGlyph: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
  },
});
