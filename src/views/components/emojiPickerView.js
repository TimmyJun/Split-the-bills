export class EmojiPickerView {
  constructor() {
    this.container = null
    this.backdrop = null
    this.eventHandlers = {}
    this.currentMemberId = null

    // common emojis
    this.commonEmojis = [
      "😊", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😇", "😉",
      "😍", "🥰", "😘", "😋", "😎", "🤓", "🧐", "🤔", "🤗", "🤭",
      "👨", "👩", "👶", "👦", "👧", "🧑", "👱", "👴", "👵", "🧓",
      "🦊", "🐱", "🐶", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸",
      "🌟", "⭐", "🔥", "❤️", "💙", "💚", "💛", "💜", "💗", "💯"
    ]
  }

  // 綁定事件處理器
  on(eventName, handler) {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(handler);
    return this;
  }

  // 觸發事件
  emit(eventName, data) {
    const handlers = this.eventHandlers[eventName] || [];
    handlers.forEach(handler => handler(data));
  }

  // 顯示表情選擇器
  show(memberId) {
    this.currentMemberId = memberId;

    // 創建背景和容器
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'emoji-picker-backdrop';
    this.container = document.createElement('div');
    this.container.className = 'emoji-picker';

    // 設置容器內容
    this.container.innerHTML = `
      <div class="emoji-picker-header">
        <div class="emoji-picker-title">選擇表情符號</div>
        <button class="emoji-picker-close">×</button>
      </div>
      <div class="emoji-grid">
        ${this.commonEmojis.map(emoji =>
      `<div class="emoji-item" data-emoji="${emoji}">${emoji}</div>`
    ).join('')}
      </div>
    `;

    // 添加到 DOM
    this.backdrop.appendChild(this.container);
    document.body.appendChild(this.backdrop);

    // 綁定事件
    this.bindEvents();
  }

  // 綁定事件
  bindEvents() {
    // 關閉按鈕
    const closeBtn = this.container.querySelector('.emoji-picker-close');
    closeBtn.addEventListener('click', () => this.hide());

    // 點擊背景關閉
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.hide();
      }
    });

    // 選擇表情
    const emojiItems = this.container.querySelectorAll('.emoji-item');
    emojiItems.forEach(item => {
      item.addEventListener('click', () => {
        const emoji = item.dataset.emoji;
        this.emit('emoji-selected', {
          memberId: this.currentMemberId,
          emoji: emoji
        });
        this.hide();
      });
    });
  }

  // 關閉表情選擇器
  hide() {
    if (this.backdrop) {
      document.body.removeChild(this.backdrop);
      this.backdrop = null;
      this.container = null;
    }
  }
}