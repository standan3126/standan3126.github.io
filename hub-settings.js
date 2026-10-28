// GameHub's own settings, behind the gear on the start page: the starting point for every game's
// shared settings (Light, sounds, music, nature sounds). A game's own Settings has the final say
// for that game, and its "Reset to GameHub settings" comes back to these. See shared/v1/settings.js.
import { addSettingsGear } from '/shared/v1/kit.js'
import { gameStore } from '/shared/v1/save.js'
import { HUB_ID, SettingsPanel } from '/shared/v1/settings.js'

const panel = new SettingsPanel({
  gameId: HUB_ID,
  title: 'GameHub settings',
  store: gameStore(HUB_ID),
  global: true,
  intro: 'Every game starts with these. Anything you change inside a game stays that way for that game.',
  onChange: applyLight,
})

function applyLight() {
  document.documentElement.dataset.theme = panel.night ? 'night' : 'day'
  document.querySelector('meta[name="theme-color"]').content = panel.night ? '#1a0e06' : '#f4efe4'
}
applyLight()

addSettingsGear(() => panel.open())
window.hubSettings = panel
