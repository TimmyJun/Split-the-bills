export class SettingDialog {
  constructor() {
    this.dialog = null
    this.errorMessage = null // 追踪錯誤訊息狀態
    this.createDialogElement()
    this.setupDialogEventListeners()
  }

  createDialogElement() {
    this.dialog = document.createElement('dialog')
    this.dialog.className = 'project-dialog card'
    document.body.appendChild(this.dialog)
  }

  updateDialogPosition() {
    const settingBtn = document.querySelector('.setting-btn')
    if (!settingBtn || !this.dialog) return

    const btnRect = settingBtn.getBoundingClientRect()
    const dialogRect = this.dialog.getBoundingClientRect()

    // 計算理想的位置（在按鈕下方）
    let top = btnRect.bottom + 8
    let left = btnRect.left

    // 確保 dialog 不會超出視窗範圍
    const maxTop = window.innerHeight - dialogRect.height - 8
    const maxLeft = window.innerWidth - dialogRect.width - 8

    // 調整位置確保完全可見
    top = Math.min(top, maxTop)
    left = Math.min(left, maxLeft)
    left = Math.max(8, left) //確保左側至少有 8px 的間距

    // 如果空間不夠，考慮將 dialog 放在按鈕上方
    if (top > maxTop && btnRect.top > dialogRect.height) {
      top = btnRect.top - dialogRect.height - 8;
    }

    this.dialog.style.position = 'fixed';
    this.dialog.style.top = `${top}px`;
    this.dialog.style.left = `${left}px`;
    this.dialog.style.margin = '0';
  }

  setupDialogEventListeners() {
    // 點擊 dialog 外部關閉
    this.dialog.addEventListener('click', (e) => {
      const dialogDimensions = this.dialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        this.dialog.close()
      }
    });
  }

  // 等待 dialog 關閉的 Promise
  waitForDialogClose() {
    return new Promise(resolve => {
      const closeHandler = () => {
        this.dialog.removeEventListener('close', closeHandler);
        resolve();
      };
      this.dialog.addEventListener('close', closeHandler);
    });
  }


  // new user
  async showNewProjectDialog(onSubmit, isForceShow = false) {
    this.clearError() // 清除任何現有的錯誤訊息

    // 確保 dialog 是關閉的狀態
    if (this.dialog.open) {
      await this.waitForDialogClose();
    }

    this.dialog.innerHTML = `
         <div class="dialog-header">
          <h2 class="section-title">Create New Project</h2>
          ${!isForceShow ? '<button class="btn close-btn" type="button">&times;</button>' : ''}
        </div>
        <form id="new-project-form" class="dialog-form">
          <div class="form-group">
            <input type="text" class="input-field" placeholder="Project Name" required>
          </div>
          <div class="form-group">
            <textarea class="input-field project-description-input" placeholder="Project Description (optional)" rows="3"></textarea>
          </div>
          <div class="dialog-actions">
            <button type="submit" class="btn add-btn">Create Project</button>
          </div>
        </form>
        `;

    const form = this.dialog.querySelector('form')
    const nameInput = form.querySelector('.input-field:not(.project-description-input)')
    const descriptionInput = form.querySelector('.project-description-input')
    const closeBtn = this.dialog.querySelector('.close-btn')

    form.onsubmit = async (e) => {
      e.preventDefault()
      const name = nameInput.value.trim()
      const description = descriptionInput.value.trim()

      if (name) {
        try {
          const wasForceShown = this._forceShowActive
          this._forceShowActive = false

          if (this._originalClose) {
            this.dialog.close = this._originalClose;
            this._originalClose = null;
          }

          await onSubmit(name, description)
          this.dialog.close()
          this._forceShowActive = false
        } catch (error) {
          // 恢復強制顯示
          this._forceShowActive = isForceShow;
          this.showError(nameInput, error.message);
        }
      }
    }

    if (closeBtn) {
      closeBtn.onclick = () => this.dialog.close();
    }

    this.setupForceShowBehavior(isForceShow)

    this.dialog.showModal()
    this.updateDialogPosition()

    // 在視窗調整大小時更新位置
    const resizeHandler = () => this.updateDialogPosition()
    window.addEventListener('resize', resizeHandler)

    // dialog 關閉時移除事件監聽
    const closeHandler = () => {
      window.removeEventListener('resize', resizeHandler)
      this.dialog.removeEventListener('close', closeHandler)
    }
    this.dialog.addEventListener('close', closeHandler)
  }

  // old user
  showProjectListDialog(projects, currentProjectId, onProjectSelect, onNewProject) {
    this.editingProjectId = null
    this.renderProjectList(projects, currentProjectId, onProjectSelect, async () => {
      await this.waitForDialogClose();
      onNewProject();
    })

    this.updateDialogPosition()

    // 在視窗調整大小時更新位置
    const resizeHandler = () => this.updateDialogPosition();
    window.addEventListener('resize', resizeHandler);

    // dialog 關閉時移除事件監聽
    const closeHandler = () => {
      window.removeEventListener('resize', resizeHandler);
      this.dialog.removeEventListener('close', closeHandler);
    };
    this.dialog.addEventListener('close', closeHandler);
  }

  renderProjectList(projects, currentProjectId, onProjectSelect, onNewProject) {
    this.clearError() // 清除任何現有的錯誤訊息

    this.dialog.innerHTML = `
    <div class="dialog-header">
      <h2 class="section-title">Your Projects</h2>
      <button class="btn close-btn" type="button">&times;</button>
    </div>
    <div class="project-list">
      ${projects.map(project => `
        <div class="project-item ${project.id === currentProjectId ? 'active' : ''}" 
             data-project-id="${project.id}">
          ${this.editingProjectId === project.id
        ? `<div class="form-group">
                <input type="text" class="input-field" value="${project.name}" placeholder="Project Name">
                <textarea class="input-field project-description-input" placeholder="Project Description (optional)" rows="2">${project.description || ''}</textarea>
              </div>`
        : `<div>
                <span class="project-name">${project.name}</span>
                ${project.description
          ? `<div class="project-description-preview" data-description="${this.escapeHtml(project.description)}">${this.truncateText(project.description, 20)}</div>`: ''}
              </div>`
      }
          <div class="project-list-btns">
            <button class="btn ${this.editingProjectId === project.id ? 'add-btn' : 'edit-btn'}" 
                    data-action="${this.editingProjectId === project.id ? 'save' : 'edit'}">
              ${this.editingProjectId === project.id ? 'Save' : 'Edit'}
            </button>
            <button class="btn remove-btn" data-action="delete">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="dialog-actions">
      <button id="new-project-btn" class="btn add-btn">New Project</button>
    </div>
  `;

    const closeBtn = this.dialog.querySelector('.close-btn')
    closeBtn.onclick = () => this.dialog.close()

    this.dialog.querySelector('.project-list').onclick = async (e) => {
      const projectItem = e.target.closest('.project-item')
      const actionButton = e.target.closest('button[data-action]')

      if (!projectItem) return
      const projectId = projectItem.dataset.projectId

      if (actionButton) {
        e.stopPropagation()
        const action = actionButton.dataset.action

        if (action === "delete") {
          if (confirm('Are you sure you want to delete this project?')) {
            onProjectSelect(projectId, 'delete');
            this.dialog.close();
          }
        } else if (action === 'edit') {
          // 進入編輯模式
          this.editingProjectId = projectId
          this.renderProjectList(projects, currentProjectId, onProjectSelect, onNewProject)

          // 自動聚焦到輸入框
          setTimeout(() => {
            const input = projectItem.querySelector('.input-field')
            if (input) {
              input.focus()
              input.select()
            }
          }, 0)
        } else if (action === 'save') {
          const formGroup = projectItem.querySelector('.form-group')
          const nameInput = formGroup.querySelector('.input-field:not(.project-description-input)')
          const descriptionInput = formGroup.querySelector('.project-description-input')
          const newName = nameInput.value.trim()
          const newDescription = descriptionInput.value.trim()

          if (newName) {
            try {
              await onProjectSelect(projectId, "edit", newName, newDescription)
              this.editingProjectId = null
              this.renderProjectList(
                projects.map(p => p.id === projectId ? { ...p, name: newName, description: newDescription } : p),
                currentProjectId,
                onProjectSelect,
                onNewProject
              )
            } catch (error) {
              this.showError(input, error.message)
            }
          }
        }
      } else if (projectItem && !this.editingProjectId) {
        // 只有在非編輯模式下才允許切換專案
        onProjectSelect(projectId, 'select')
        this.dialog.close()
      }
    }

    this.dialog.querySelector('#new-project-btn').onclick = () => {
      this.dialog.close()
      onNewProject()
    }

    this.dialog.showModal()
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearError() {
    if (this.errorMessage) {
      this.errorMessage.remove()
      this.errorMessage = null
    }

    // 移除所有輸入框的錯誤樣式
    this.dialog.querySelectorAll('.input-field.error').forEach(input => {
      input.classList.remove('error');
    })
  }

  showError(input, message) {
    // 移除任何現有的錯誤訊息
    this.clearError()

    // 創建並插入錯誤訊息
    this.errorMessage = document.createElement('div')
    this.errorMessage.className = 'dialog-error-message'
    this.errorMessage.textContent = message

    // 將錯誤訊息插入到標題下方
    const header = this.dialog.querySelector('.dialog-header');
    header.parentNode.insertBefore(this.errorMessage, header.nextSibling);

    // 添加錯誤樣式到輸入框
    input.classList.add('error')

    // 設置輸入框更改時移除錯誤
    const clearError = () => {
      this.clearError()
      input.removeEventListener('input', clearError)
    }
    input.addEventListener('input', clearError)
  }

  setupForceShowBehavior(isForceShow) {
    // 移除任何先前的點擊事件監聽器
    if (this._clickOutsideHandler) {
      this.dialog.removeEventListener('click', this._clickOutsideHandler);
      this._clickOutsideHandler = null;
    }

    if (this._originalClose) {
      this.dialog.close = this._originalClose;
      this._originalClose = null;
    }

    this._forceShowActive = false

    if (isForceShow) {
      // 保存原始的 close 方法
      this._originalClose = this.dialog.close;

      // 覆蓋 close 方法，使其在表單提交成功時才能關閉
      this.dialog.close = () => {
        // 只允許在非強制顯示狀態時關閉
        if (!this._forceShowActive) {
          this._originalClose.call(this.dialog);
        }
      };

      this._forceShowActive = true
    } else {
      // 如果存在原始 close 方法，恢復它
      if (this._originalClose) {
        this.dialog.close = this._originalClose;
        this._originalClose = null;
      }

      this._forceShowActive = false;

      // 添加點擊外部關閉的功能
      this._clickOutsideHandler = (e) => {
        const dialogDimensions = this.dialog.getBoundingClientRect();
        if (
          e.clientX < dialogDimensions.left ||
          e.clientX > dialogDimensions.right ||
          e.clientY < dialogDimensions.top ||
          e.clientY > dialogDimensions.bottom
        ) {
          this.dialog.close();
        }
      };
      this.dialog.addEventListener('click', this._clickOutsideHandler);
    }
  }

  onDialogClosed(callback) {
    if (!this._closeCallbacks) {
      this._closeCallbacks = [];

      // 監聽原生的 close 事件
      this.dialog.addEventListener('close', () => {
        this._closeCallbacks.forEach(cb => cb());
      });
    }

    // 添加到回調列表
    this._closeCallbacks.push(callback);

    // 返回 this 以便鏈式調用
    return this;
  }

}