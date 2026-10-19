// src/main.ts
import Phaser from 'phaser';
import { PHYSICS_CONFIG } from './config/physics';
import { HelpScene } from './scenes/HelpScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: PHYSICS_CONFIG.LOGIC_WIDTH,
  height: PHYSICS_CONFIG.LOGIC_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: PHYSICS_CONFIG.LOGIC_WIDTH,
    height: PHYSICS_CONFIG.LOGIC_HEIGHT,
  },
  input: {
    keyboard: {
      // Phaser sẽ tự động gọi preventDefault cho các phím này SAU KHI xử lý phím,
      // giúp chống cuộn trang mà không làm chặn input của game.
      capture: [
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ],
    },
  },
  scene: [HelpScene, GameScene],
};

new Phaser.Game(config);
