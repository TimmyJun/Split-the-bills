export class AnimationService {
  constructor() {
    this.sections = [
      '.project-section',
      '.members-section',
      '.transactions-section',
      '.chart-section'
    ];
    this.isFirstLoad = true;
    this.loadingOverlay = null;
    this.setupLoadingOverlay();
  }

  // 初始化動畫相關設定
  initialize() {
    // 為各區塊添加動畫準備class
    this.sections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.classList.add('section-animate');
      }
    });
  }

  // 創建和設置載入中遮罩
  setupLoadingOverlay() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(this.loadingOverlay);
  }

  // 顯示載入中遮罩
  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hide')
      document.body.appendChild(this.loadingOverlay)
    }
  }

  // 隱藏載入中遮罩
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hide');
    }
  }

  // 處理頁面第一次載入的動畫
  handleFirstLoad() {
    if (!this.isFirstLoad) return;

    // 延遲一小段時間後開始動畫
    setTimeout(() => {
      this.triggerEntranceAnimation();
      this.isFirstLoad = false;
      this.hideLoading();
    }, 300);
  }

  // 觸發進場動畫
  triggerEntranceAnimation() {
    // 檢查sections是否都存在於DOM中
    const allSectionsExist = this.sections.every(selector => {
      return document.querySelector(selector) !== null
    })

    if (!allSectionsExist) {
      console.warn('Some sections are missing in the DOM. Animation might not work properly.');
    }

    // 依次為各section添加顯示class
    this.sections.forEach((selector, index) => {
      const section = document.querySelector(selector)
      if (section) {
        setTimeout(() => {
          section.classList.add('animate-in')
        }, index * 100)
      }
    })
  }

  // 處理專案切換的轉場動畫
  handleProjectTransition(callback) {
    // 添加過渡class
    document.querySelector('.app-wrapper').classList.add('transitioning');

    // 重置各section的動畫狀態
    this.sections.forEach(selector => {
      const section = document.querySelector(selector)
      if (section) {
        section.classList.remove('animate-in')
      }
    })

    // 顯示載入中遮罩
    this.showLoading()

    // 延遲執行回調以允許過渡效果顯示
    setTimeout(() => {
      // 執行切換邏輯
      if (typeof callback === 'function') {
        callback()
      }

      // 移除過渡class並觸發進場動畫
      setTimeout(() => {
        document.querySelector('.app-wrapper').classList.remove('transitioning')
        this.triggerEntranceAnimation()
        this.hideLoading()
      }, 300)
    }, 300)
  }

  // 為新增的項目添加高亮效果
  highlightNewItem(element) {
    if (!element) return;

    // 移除可能存在的舊動畫class
    element.classList.remove('highlight-new');

    // 強制重繪以重置動畫
    void element.offsetWidth;

    // 添加高亮動畫class
    element.classList.add('highlight-new');
  }
}