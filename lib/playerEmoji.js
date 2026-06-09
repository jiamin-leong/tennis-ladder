const PROFILE_EMOJIS = ['🦁', '🐯', '🦊', '🐺', '🦅', '🦋', '🐬', '🦄', '🐉', '🦈', '🦩', '🦚', '🐙', '🦎', '🦜', '🐧', '🐻', '🦝', '🦦', '🦓'];

export function profileEmoji(id) {
  return PROFILE_EMOJIS[id % PROFILE_EMOJIS.length];
}
