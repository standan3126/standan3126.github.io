# GameHub patterns

Game ideas that worked in one game and are worth reusing. The **code** lives in the toolbox
(`v1/`, listed in `v1/README.md`); this page keeps the **why and the rules**, so a new game can borrow
the idea without working it out again. Before designing something new, look here first. When a
game finds a new pattern, add it here and point to its code.

## The book

*From Quiet Numbers' Sudoku (2026-10-30). Code: `v1/book.js` + `v1/book.css`.*

A game's levels are the pages of a puzzle book. It fits any game with many separate levels
(puzzles, boards, pictures, rounds).

- **One book per kind or difficulty** (Easy book, Medium book...). A fixed number of levels for
  version 1; updates add more at the end, never change existing ones.
- **Six levels a page** (3 across, 2 down), each a small picture of that level as it stands plus
  its state: fresh, in progress (time so far), or finished (time and how it was done).
- **Arrows** to the first, previous, next and last page, with "Page 3 of 100" between them.
- **Start sits in Play's spot**, greyed until a level on this page is picked; its words say what
  happens ("Start puzzle 9", "Continue puzzle 4", "Look at puzzle 1"). Flipping away from the
  picked level lets go of it.
- **Any page can be played**, like a real book. Play on the launch page opens the book at the level
  last played, already picked.
- **Finished levels are final**: kept exactly as they ended, open to look at, never redone.
  Finishing a whole book moves the player on to the next one.
- **Home goes up one step**: from a level to its book, from the book to the launch page.
- Save each book under its own key (`<game>:book-<name>`), and a level only once something is done
  on it, so untouched pages cost nothing.

## The back of the book (an honest record, not a penalty)

*From Quiet Numbers (2026-10-30).*

Paper puzzle books keep the answers in the back: you can always look, and it's up to you. The game
does the same: help is always there, and it's **recorded**, not forbidden.

- Nothing is checked while you play; when the level is complete it says solved, or **only how
  many** things are wrong.
- Help tools (Hint: circles wrong answers, then a wait; Look: the answer key after one "are you
  sure?") are always available, counted on that level for good.
- The score is the honest record: "Solved on your own" (no help) or "Solved with 2 hints, looked".
  Best times count only levels done on your own.
- Anything that reacts differently to a right and a wrong answer (sounds, notes clearing, colours)
  is a hidden check: make it the same for both.

## Tap = pencil, drag = ink

*From Quiet Numbers (2026-10-30). Code: in `quiet-numbers/js/main.js` (move to the toolbox when a
second game needs it).*

The touch itself says how sure you are, so there are no mode buttons.

- **Tap** = a light, safe mark (a note, a maybe): never checked, easy to remove.
- **Drag** = a committed answer (ink): deliberate, so a stray tap can never commit anything.
- A held number and a picked square never go together, so a tap never does something hidden.

## Finger or stylus (dragging you can see)

*From Quiet Numbers (2026-10-30). Code: `tapToStart({ choices })` in `v1/kit.js` for the question;
the drag in `quiet-numbers/js/main.js` (`FINGER_LIFT`, `dropPoint`).*

A finger hides what it drags (the "fat finger" problem). Ask on the start card: **Finger** = the
dragged thing floats about 72 px above the fingertip and lands where *it* is (a ring shows the
target); **Stylus** = it sits at the tip, see-through. Asked every time the game opens; not saved.

## The rules page and the play-time clock

*From Quiet Numbers (2026-10-30). Code: `gameFrame({ onHelp })` in `v1/kit.js` (the ? under the
gear); the rules sheet and clock in the game.*

- A **?** under the gear while playing opens the rules over the board; it opens by itself the
  first time. Tap anywhere to close.
- A stopwatch counts **only while the board is in full view**: not while the rules, Settings, an
  answer key or a done card cover it, nor when the app is hidden.
