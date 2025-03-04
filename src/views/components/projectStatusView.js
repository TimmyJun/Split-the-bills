export class ProjectStatusView {
  constructor() {
    this.eventHandlers = {}
  }

  // 綁定事件處理器
  on(eventName, handler) {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || []
    this.eventHandlers[eventName].push(handler)
    return this
  }

  // 觸發事件
  emit(eventName, data) {
    const handlers = this.eventHandlers[eventName] || []
    handlers.forEach(handler => handler(data))
  }

  // 渲染狀態徽章
  renderStatusBadge(status) {
    const statusClass = status === "active" ? "status-active" : "status-closed"
    return `<div class="project-badge ${statusClass}">${status}</div>`
  }

  // 顯示狀態選擇對話框
  showStatusSelector(currentStatus) {
    // 創建對話框背景
    const backdrop = document.createElement('div')
    backdrop.className = 'status-selector-backdrop'
    backdrop.style.position = 'fixed'
    backdrop.style.top = '0'
    backdrop.style.left = '0'
    backdrop.style.width = '100%'
    backdrop.style.height = '100%'
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    backdrop.style.display = 'flex'
    backdrop.style.justifyContent = 'center'
    backdrop.style.alignItems = 'center'
    backdrop.style.zIndex = '1000'

    // 創建對話框內容
    const dialogContent = document.createElement('div')
    dialogContent.className = 'status-selector-content'
    dialogContent.style.backgroundColor = 'white'
    dialogContent.style.borderRadius = '8px'
    dialogContent.style.padding = '20px'
    dialogContent.style.width = '300px'
    dialogContent.style.maxWidth = '90%'
    dialogContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'

    dialogContent.innerHTML = `
      <h3 style="margin-top: 0; color: #5B21B6;">Project Status</h3>
      <p>Change project status to:</p>
      <div class="status-options" style="display: flex; flex-direction: column; gap: 10px; margin: 15px 0;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="project-status" value="active" ${currentStatus === 'active' ? 'checked' : ''}>
          <span style="font-weight: ${currentStatus === 'active' ? 'bold' : 'normal'};">
            Active <span style="color: #5cde1d; font-size: 0.8em;">(Editable)</span>
          </span>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="radio" name="project-status" value="closed" ${currentStatus === 'closed' ? 'checked' : ''}>
          <span style="font-weight: ${currentStatus === 'closed' ? 'bold' : 'normal'};">
            Closed <span style="color: #9CA3AF; font-size: 0.8em;">(Not editable)</span>
          </span>
        </label>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
        <button class="btn cancel-btn" style="background-color: #9CA3AF;">Cancel</button>
        <button class="btn save-btn">Save</button>
      </div>
    `

    backdrop.appendChild(dialogContent)
    document.body.appendChild(backdrop)

    // 綁定按鈕事件
    const cancelBtn = dialogContent.querySelector('.cancel-btn')
    const saveBtn = dialogContent.querySelector('.save-btn')
    const radioButtons = dialogContent.querySelectorAll('input[name="project-status"]')

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop)
    })

    saveBtn.addEventListener('click', () => {
      const selectedValue = dialogContent.querySelector('input[name="project-status"]:checked').value
      this.emit('status-change-requested', { status: selectedValue })
      document.body.removeChild(backdrop)
    })

    // 點擊背景關閉
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop)
      }
    })
  }

  // 初始化事件監聽
  initEventListeners(badgeElement) {
    badgeElement.style.cursor = 'pointer'
    badgeElement.addEventListener('click', () => {
      const currentStatus = badgeElement.textContent.toLowerCase()
      this.showStatusSelector(currentStatus)
    })
  }

  // 更新UI以反映專案狀態
  updateUIForProjectStatus(isEditable) {
    // 獲取所有需要根據專案狀態禁用的元素
    const editableElements = [
      ...document.querySelectorAll('.add-member-group .input-field, .add-member-group .btn'),
      ...document.querySelectorAll('.add-expense-group .input-field, .add-expense-group .btn'),
      ...document.querySelectorAll('.member-row .edit-btn, .member-row .remove-btn'),
      ...document.querySelectorAll('.expense-row .edit-btn, .expense-row .remove-btn')
    ]

    // 根據專案狀態啟用或禁用這些元素
    editableElements.forEach(element => {
      if (isEditable) {
        element.disabled = false
        element.style.opacity = '1'
        element.style.cursor = 'pointer'
      } else {
        element.disabled = true
        element.style.opacity = '0.5'
        element.style.cursor = 'not-allowed'
      }
    })

    if(isEditable) {
      document.querySelectorAll('.closed-project-notice').forEach(notice => {
        notice.remove()
      })

      const transactionSection = document.querySelector('.transactions-section')
      if (transactionSection) {
        const transactionNotice = transactionSection.querySelector('.closed-project-notice');
        if (transactionNotice) {
          transactionNotice.remove();
        }
      }
      return
    }

    // 添加一個視覺提示 (當狀態為closed時)
    const formGroups = [
      document.querySelector('.add-member-group'),
      document.querySelector('.add-expense-group')
    ]

    formGroups.forEach(formGroup => {
      if (formGroup) {
        if (!isEditable) {
          // 如果尚未添加提示，則添加
          if (!formGroup.querySelector('.closed-project-notice')) {
            const notice = document.createElement('div')
            notice.className = 'closed-project-notice'
            notice.textContent = 'Project is closed. No edits allowed.'
            notice.style.color = '#9CA3AF'
            notice.style.width = "250px"
            notice.style.fontStyle = 'italic'
            notice.style.fontSize = '14px'
            notice.style.marginTop = '10px'

            if (formGroup.closest('.transactions-section')) {
              formGroup.querySelector('.closed-project-notice')?.remove()
              const transactionSection = formGroup.closest('.transactions-section')
              const existingNotice = transactionSection.querySelector('.closed-project-notice')

              if (!existingNotice) {
                // 創建新的提示並添加到區塊底部
                notice.style.textAlign = 'center';
                notice.style.width = '100%';
                notice.style.margin = '20px auto 10px auto';
                notice.style.padding = '10px 0';

                // 添加到整個transactions-section的底部
                transactionSection.appendChild(notice);
              }

              return
            }else {
              notice.style.textAlign = 'center'
              notice.style.width = "250px"
              notice.style.margin = "10px auto"
            }

            formGroup.appendChild(notice)
          }
        } else {
          // 如果有提示，則移除
          const notice = formGroup.querySelector('.closed-project-notice')
          if (notice) {
            formGroup.removeChild(notice)
          }
        }
      }
    })
  }
}