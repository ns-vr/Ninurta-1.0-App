
const XP_KEY = 'ninurta-user-xp';
const STREAK_KEY = 'ninurta-user-streak';

interface StreakData {
    streak: number;
    lastLogin: string; // YYYY-MM-DD
}

/**
 * Retrieves the current XP from localStorage.
 * @returns The current XP value, or 0 if not found/error.
 */
export const getXp = (): number => {
    try {
        const storedXp = localStorage.getItem(XP_KEY);
        if (storedXp === null) {
            return 0;
        }
        const xp = parseInt(storedXp, 10);
        return isNaN(xp) ? 0 : xp;
    } catch (error) {
        console.error("Failed to retrieve XP from localStorage:", error);
        return 0;
    }
};

/**
 * Adds a specified amount of XP to the total and saves to localStorage.
 * @param amount The amount of XP to add. Must be a positive number.
 * @returns The new total XP.
 */
export const addXp = (amount: number): number => {
    if (amount <= 0) return getXp();
    
    const currentXp = getXp();
    const newXp = currentXp + amount;
    
    try {
        localStorage.setItem(XP_KEY, newXp.toString());
        // Dispatch a storage event so other tabs can update
        window.dispatchEvent(new Event('storage'));
        return newXp;
    } catch (error) {
        console.error("Failed to save XP to localStorage:", error);
        return currentXp; // Return old value on failure
    }
};

/**
 * Retrieves streak data from localStorage.
 * @returns StreakData object.
 */
export const getStreak = (): StreakData => {
    try {
        const storedStreak = localStorage.getItem(STREAK_KEY);
        if (storedStreak) {
            return JSON.parse(storedStreak);
        }
    } catch (error) {
        console.error("Failed to retrieve streak data:", error);
    }
    return { streak: 0, lastLogin: '' };
};

/**
 * Updates the daily streak based on the current date.
 * Should be called after a meaningful user action (e.g., finishing a quiz).
 */
export const updateStreak = () => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const streakData = getStreak();
        
        if (streakData.lastLogin === todayStr) {
            return; // Already logged in today
        }
        
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (streakData.lastLogin === yesterdayStr) {
            newStreak = streakData.streak + 1;
        }
        
        const newStreakData: StreakData = {
            streak: newStreak,
            lastLogin: todayStr,
        };
        
        localStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.error("Failed to update streak data:", error);
    }
};
