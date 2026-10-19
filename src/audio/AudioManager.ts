// src/audio/AudioManager.ts
import { isAudioMuted, setAudioMuted } from '../utils/save';

/**
 * Class AudioManager (Singleton) quản lý toàn bộ hệ thống âm thanh Web Audio API
 * - Tổng hợp âm thanh bằng Oscillator và Gain Envelope kiểu 8-bit retro/chiptune (không dùng file).
 * - Khởi tạo AudioContext lười (lazy), chỉ chạy/resume sau tương tác người dùng đầu tiên.
 * - Bọc try/catch chống crash nếu trình duyệt chặn hoặc không hỗ trợ.
 * - Quản lý master volume, phím N bật/tắt (mute) và lưu trạng thái vào localStorage.
 * - Tạm dừng âm thanh khi game ở trạng thái Pause.
 */
export class AudioManager {
  private static instance: AudioManager;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Trạng thái bật/tắt tiếng
  private isMuted: boolean = false;

  // Trạng thái tạm dừng
  private isPaused: boolean = false;

  // Âm lượng tổng mặc định vừa phải, không gây chói tai
  private readonly masterVolume: number = 0.25;

  // Giới hạn tần suất phát âm thanh nảy (bounce) để tránh chói tai khi nảy liên tục
  private lastBounceTime: number = 0;

  // Danh sách các listener lắng nghe khi trạng thái mute thay đổi
  private muteChangeListeners: Array<(isMuted: boolean) => void> = [];

  private constructor() {
    this.isMuted = isAudioMuted();
    this.setupUnlockListeners();
  }

  /**
   * Lấy instance Singleton của AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Đăng ký lắng nghe tương tác đầu tiên của người dùng để mở khoá AudioContext (chống chặn autoplay)
   */
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.ensureContext();
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  /**
   * Khởi tạo hoặc tiếp tục (resume) AudioContext lười (lazy).
   * Bọc trong try/catch: nếu lỗi xảy ra thì trả về null và game vẫn chạy êm ái trong im lặng.
   */
  private ensureContext(): AudioContext | null {
    if (this.isMuted || this.isPaused) {
      return null;
    }

    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return null;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.isMuted ? 0 : this.masterVolume,
          this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch (err) {
      console.warn('[AudioManager] Không thể khởi tạo AudioContext:', err);
      return null;
    }
  }

  /**
   * Kiểm tra xem âm thanh có đang bị mute hay không
   */
  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Bật/tắt trạng thái mute âm thanh (phím N)
   * Lưu trạng thái vào localStorage qua save.ts và thông báo cho các listener
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    setAudioMuted(this.isMuted);

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(
          this.isMuted ? 0 : this.masterVolume,
          this.ctx.currentTime
        );
      } catch (e) {
        console.warn('[AudioManager] Lỗi cập nhật masterGain:', e);
      }
    }

    // Thông báo cho các UI component (HUD, menu) cập nhật icon loa
    for (const listener of this.muteChangeListeners) {
      try {
        listener(this.isMuted);
      } catch {}
    }

    return this.isMuted;
  }

  /**
   * Đăng ký callback khi mute thay đổi
   */
  public onMuteChange(listener: (isMuted: boolean) => void): () => void {
    this.muteChangeListeners.push(listener);
    return () => {
      this.muteChangeListeners = this.muteChangeListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Cập nhật trạng thái tạm dừng của game.
   * Khi tạm dừng, không cho phép phát bất kỳ âm thanh mới nào.
   */
  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  // ===============================================================
  // CÁC HIỆU ỨNG ÂM THANH CHIPTUNE TỔNG HỢP (OSCILLATOR + GAIN ENVELOPE)
  // ===============================================================

  /**
   * 1. Bounce: Tiếng "bốp" ngắn khi bóng chạm sàn nảy.
   * Giới hạn tần suất (throttle) và âm lượng nhỏ để không chói tai khi nảy liên tục.
   * Tần số hơi khác biệt giữa bóng nhỏ (cao hơn) và bóng phồng (trầm hơn).
   */
  public playBounce(form: 'small' | 'big' = 'small'): void {
    const now = Date.now();
    // Giới hạn tối thiểu 110ms giữa hai lần phát tiếng nảy
    if (now - this.lastBounceTime < 110) return;
    this.lastBounceTime = now;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = form === 'big' ? 0.09 : 0.07;
      const startFreq = form === 'big' ? 120 : 180;
      const endFreq = form === 'big' ? 45 : 65;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

      // Âm lượng nảy nhỏ vừa phải (0.12 - 0.14)
      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  }

  /**
   * 2. Jump: Tiếng nhảy cao hơn bình thường (tần số quét lên nhanh)
   */
  public playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = 0.12;

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, startTime);
      osc.frequency.exponentialRampToValueAtTime(360, startTime + duration);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  }

  /**
   * 3. Ring: Nhặt ring (hai nốt đi lên vui tai: D5 -> A5)
   */
  public playRing(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 587.33, dur: 0.06 }, // D5
        { freq: 880.0, dur: 0.12 },  // A5
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.85;
      }
    } catch {}
  }

  /**
   * 4. Die: Bóng chết (âm quét đi xuống + tiếng ồn vỡ vụn retro)
   */
  public playDie(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const duration = 0.35;

      // 1. Âm quét tần số đi xuống (sawtooth)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, startTime);
      osc.frequency.exponentialRampToValueAtTime(40, startTime + duration);

      oscGain.gain.setValueAtTime(0.18, startTime);
      oscGain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        oscGain.disconnect();
      };

      // 2. Tiếng nổ vỡ vụn (noise buffer bọc bộ lọc lowpass)
      const bufferSize = Math.floor(ctx.sampleRate * 0.25);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, startTime);
      filter.frequency.linearRampToValueAtTime(100, startTime + 0.25);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.16, startTime);
      noiseGain.gain.linearRampToValueAtTime(0, startTime + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(startTime);
      noise.stop(startTime + 0.25);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        noiseGain.disconnect();
      };
    } catch {}
  }

  /**
   * 5. Checkpoint: Kích hoạt checkpoint (chuỗi 3 nốt nhạc sáng trong trẻo)
   */
  public playCheckpoint(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 523.25, dur: 0.05 }, // C5
        { freq: 659.25, dur: 0.05 }, // E5
        { freq: 783.99, dur: 0.15 }, // G5
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.15, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.9;
      }
    } catch {}
  }

  /**
   * 6. ExitOpen: Cổng thoát mở ra (chuỗi hợp âm ngân vang báo hiệu hoàn thành thu thập ring)
   */
  public playExitOpen(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 392.0, dur: 0.07 },  // G4
        { freq: 523.25, dur: 0.07 }, // C5
        { freq: 659.25, dur: 0.07 }, // E5
        { freq: 783.99, dur: 0.10 }, // G5
        { freq: 1046.5, dur: 0.25 }, // C6
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.16, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.8;
      }
    } catch {}
  }

  /**
   * 7. Win: Hoàn thành màn chơi (Level Complete - giai điệu chiptune chiến thắng 5 nốt)
   */
  public playWin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 523.25, dur: 0.09 }, // C5
        { freq: 659.25, dur: 0.09 }, // E5
        { freq: 783.99, dur: 0.09 }, // G5
        { freq: 987.77, dur: 0.12 }, // B5
        { freq: 1046.5, dur: 0.35 }, // C6 ngân dài
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.15, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.85;
      }
    } catch {}
  }

  /**
   * 8. GameOver: Hết mạng thua cuộc (giai điệu trầm buồn đi xuống)
   */
  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 311.13, dur: 0.16 }, // D#4
        { freq: 293.66, dur: 0.16 }, // D4
        { freq: 277.18, dur: 0.16 }, // C#4
        { freq: 261.63, dur: 0.45 }, // C4
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.14, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.9;
      }
    } catch {}
  }

  /**
   * 9. Inflate: Bơm phồng bóng (âm quét lên dạng bóng nước nở to)
   */
  public playInflate(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = 0.18;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, startTime);
      osc.frequency.exponentialRampToValueAtTime(500, startTime + duration);

      gain.gain.setValueAtTime(0.05, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.08);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  }

  /**
   * 10. Deflate: Xì xẹp bóng (âm quét xuống kết hợp tiếng xì hơi nhẹ)
   */
  public playDeflate(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const duration = 0.18;

      // Sóng tam giác quét từ cao xuống trầm
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, startTime);
      osc.frequency.exponentialRampToValueAtTime(130, startTime + duration);

      oscGain.gain.setValueAtTime(0.16, startTime);
      oscGain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        oscGain.disconnect();
      };

      // Thêm chút tiếng xì hơi lọc băng thông (bandpass)
      const bufferSize = Math.floor(ctx.sampleRate * 0.14);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, startTime);
      filter.Q.value = 2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, startTime);
      noiseGain.gain.linearRampToValueAtTime(0, startTime + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(startTime);
      noise.stop(startTime + 0.14);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        noiseGain.disconnect();
      };
    } catch {}
  }

  /**
   * 11. Spring: Chạm thanh nảy (âm "boing" phóng bật lên cao)
   */
  public playSpring(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = 0.22;

      osc.type = 'sine';
      // Quét cực nhanh từ 160Hz lên 640Hz rồi trượt dần xuống 260Hz
      osc.frequency.setValueAtTime(160, startTime);
      osc.frequency.exponentialRampToValueAtTime(640, startTime + 0.06);
      osc.frequency.exponentialRampToValueAtTime(260, startTime + duration);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  }

  /**
   * 12. MenuMove: Âm blip ngắn khi di chuyển con trỏ trong menu
   */
  public playMenuMove(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = 0.035;

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {}
  }

  /**
   * 13. MenuSelect: Âm bính-boong xác nhận chọn mục menu
   */
  public playMenuSelect(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const startTime = ctx.currentTime;
      const notes = [
        { freq: 587.33, dur: 0.04 }, // D5
        { freq: 880.0, dur: 0.09 },  // A5
      ];

      let noteStart = startTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.freq, noteStart);

        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + note.dur);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };

        noteStart += note.dur * 0.85;
      }
    } catch {}
  }
}
