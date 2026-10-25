import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BoundsSheet } from './BoundsSheet';
import { PHASE_COLOURS, SETUP_GREY } from './palette';
import type { Phase } from './phase';
import { cardsOf, formatBounds, setBounds, setPhaseEnabled, swapOrder, type Setup } from './setup';

type Props = { setup: Setup; onChange: (setup: Setup) => void };

/**
 * The phase cards in round order, with the swap control between them. Tapping
 * a card opens the sheet that sets its bounds. Every touch on them stays here,
 * so it never reaches the grey that starts a session.
 */
export function SetupCards({ setup, onChange }: Props) {
  const cards = cardsOf(setup);
  const [editing, setEditing] = useState<Phase | null>(null);
  return (
    <View style={styles.stack}>
      <BoundsSheet
        bounds={editing && setup.phases[editing].bounds}
        onChange={(change) => editing && onChange(setBounds(setup, editing, change))}
        onClose={() => setEditing(null)}
      />
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
            <Pressable
              style={[styles.card, { backgroundColor: background, opacity: card.enabled ? 1 : 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel={`${card.phase} ${formatBounds(card.bounds)}`}
              accessibilityHint="Sets the shortest and longest durations"
              onPress={() => setEditing(card.phase)}
            >
              <Text style={[styles.bounds, { color: ink }]}>{formatBounds(card.bounds)}</Text>
              {/* The native switch handles its own touch; this wrapper keeps it from the grey. */}
              <View onStartShouldSetResponder={() => true}>
                <Switch
                  value={card.enabled}
                  disabled={!card.canTurnOff}
                  onValueChange={(enabled) => onChange(setPhaseEnabled(setup, card.phase, enabled))}
                  trackColor={{ true: SWITCH_ON_COLOUR[card.phase] }}
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
const SWITCH_ON_COLOUR: Record<Phase, string> = { white: '#3A3A3A', black: '#9A9A9A' };

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
    color: SETUP_GREY.ink,
  },
});
