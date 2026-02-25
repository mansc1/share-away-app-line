
// Cute cartoon avatars using emoji-like characters
const AVATAR_STYLES = [
  { emoji: '🐱', bg: 'bg-pink-400' },
  { emoji: '🐶', bg: 'bg-blue-400' },
  { emoji: '🐼', bg: 'bg-gray-400' },
  { emoji: '🐰', bg: 'bg-purple-400' },
  { emoji: '🦊', bg: 'bg-orange-400' },
  { emoji: '🐸', bg: 'bg-green-400' },
  { emoji: '🐯', bg: 'bg-yellow-400' },
  { emoji: '🐷', bg: 'bg-red-400' },
];

export const getPersonAvatar = (name: string) => {
  // Create a simple hash from the name to consistently assign avatars
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % AVATAR_STYLES.length;
  return AVATAR_STYLES[index];
};
