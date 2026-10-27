# The Emblem's frame is cut from the wallpaper; its movement is drawn

The Emblem is modelled on a flat wallpaper image (`onepart.jpg`). A flat picture can't turn, and its gears aren't true circles with real teeth, so cutting them out as sprites would wobble and fail to mesh. A full vector redraw meshed properly but lost the original's engraved look. We split the two: everything that stays still (the case, the motto band, the screws and the crown) is the wallpaper's own pixels, cut out as a frame with an empty centre. Everything that turns (the gears, the lower tier and the taiji) is drawn in code from tooth counts, so every gear truly meshes and the turning is mechanically correct.

## Consequences

- The frame image and the drawn movement have to line up: the gears' layout follows the wallpaper's, and the frame's inner edge covers the gear tips. Changing either means checking the other.
- The frame is regenerated from the wallpaper by a script rather than edited by hand.
- The setup screen's background is the wallpaper's own near-black, `#202020`, so the frame's edge disappears into it.
