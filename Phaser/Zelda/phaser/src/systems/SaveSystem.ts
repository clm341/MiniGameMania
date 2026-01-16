// SaveSystem - Save/load game data to localStorage

import { PlayerData, SaveData, getDefaultPlayerData } from '../types';

const SAVE_KEY = 'zelda_lttp_save';

export class SaveSystem {
  static save(playerData: PlayerData): boolean {
    try {
      const saveData: SaveData = {
        playerData,
        timestamp: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('Game saved successfully!');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  static load(): SaveData | null {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        const saveData: SaveData = JSON.parse(data);
        console.log('Game loaded successfully!');
        return saveData;
      }
      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('Save deleted successfully!');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  static getLastSaveTime(): string | null {
    const saveData = this.load();
    if (saveData) {
      return new Date(saveData.timestamp).toLocaleString();
    }
    return null;
  }
}
