# Defer extracting draggable-list reordering

Status: Accepted — 2026-07-09

The checkbox settings list has inline drag-and-drop (dragstart/dragend/dragover/dragleave/drop)
in settings-tab.ts. The architecture review flagged extracting it into a reusable module;
declined per "one adapter = hypothetical seam, two adapters = real one" — this is the only
draggable list in the plugin, so there's no second consumer to design the interface against.

Revisit if a second draggable list is added anywhere in the plugin.
