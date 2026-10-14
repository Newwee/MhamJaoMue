export interface PlayerStats {
  pokerHands: number;
  pokerWins: number;
  pokerChipsWon: number;
  bjHands: number;
  bjWins: number;
  bjBlackjacks: number;
  bjChipsWon: number;
}

export interface StoredProfile {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  stats: PlayerStats;
}

const STORAGE_KEY = 'royal_casino_profile';

const AVATARS = [
  'avatar-king',
  'avatar-queen',
  'avatar-jack',
  'avatar-ace',
  'avatar-joker',
  'avatar-diamond',
];

export function getOrCreateProfile(): StoredProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'usr_guest',
      name: 'Guest Player',
      avatar: 'avatar-king',
      chips: 10000,
      stats: {
        pokerHands: 0,
        pokerWins: 0,
        pokerChipsWon: 0,
        bjHands: 0,
        bjWins: 0,
        bjBlackjacks: 0,
        bjChipsWon: 0,
      },
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.id && typeof parsed.chips === 'number') {
        return parsed;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const profile: StoredProfile = {
    id: `usr_${Date.now()}_${randomNum}`,
    name: `HighRoller_${randomNum}`,
    avatar: randomAvatar,
    chips: 10000,
    stats: {
      pokerHands: 0,
      pokerWins: 0,
      pokerChipsWon: 0,
      bjHands: 0,
      bjWins: 0,
      bjBlackjacks: 0,
      bjChipsWon: 0,
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export function saveProfile(profile: StoredProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export function updateChips(delta: number): number {
  const profile = getOrCreateProfile();
  profile.chips = Math.max(0, profile.chips + delta);
  saveProfile(profile);
  return profile.chips;
}

export function setChips(amount: number): number {
  const profile = getOrCreateProfile();
  profile.chips = Math.max(0, amount);
  saveProfile(profile);
  return profile.chips;
}

export function claimFaucetChips(): number {
  const profile = getOrCreateProfile();
  profile.chips += 5000;
  saveProfile(profile);
  return profile.chips;
}
