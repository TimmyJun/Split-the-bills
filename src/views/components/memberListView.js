export class MemberListView {
  constructor(container) {
    this.container = container;
    this.eventHandlers = {};
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

  // 初始化事件監聽
  initEventListeners() {
    // 成員列表事件委派處理
    this.container.addEventListener('click', (e) => {
      const memberRow = e.target.closest('.member-row')
      if (!memberRow) return

      const memberId = memberRow.dataset.memberId

      // 處理點擊頭像
      if (e.target.closest('.avatar')) {
        this.emit('avatar-click', { id: memberId })
        return
      }

      if (e.target.closest('button')) {
        if (e.target.classList.contains('remove-btn')) {
          const memberName = memberRow.querySelector('.member-name').textContent;
          this.emit('member-remove-requested', { id: memberId, name: memberName });
        } else if (e.target.classList.contains('edit-btn')) {
          this.emit('member-edit-requested', { id: memberId });
        } else if (e.target.classList.contains('save-btn')) {
          const inputField = memberRow.querySelector('.member-edit-form .input-field')
          const newName = inputField ? inputField.value.trim() : '';
          this.emit('member-save-requested', { id: memberId, name: newName });
        } else if (e.target.classList.contains('cancel-btn')) {
          this.emit('member-edit-cancelled', {});
        }
        return; // 阻止觸發整行點擊
      }

      if (!memberRow.classList.contains('editing')) {
        this.emit('member-details-requested', { id: memberId });
      }
    })

    // 新增成員按鈕事件
    const addBtn = document.querySelector('.members-section .add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const inputField = document.querySelector('.members-section .input-field');
        const memberName = inputField ? inputField.value.trim() : '';
        this.emit('member-add-requested', { name: memberName });
      });
    }
  }

  // 渲染成員列表
  render(members, editingMemberId = null) {
    this.container.innerHTML = members.map(member => this.renderMemberRow(member, editingMemberId)).join('');

    // 如果有正在編輯的成員，需要設置編輯表單
    if (editingMemberId) {
      const member = members.find(m => m.id === editingMemberId);
      if (member) {
        this.setupEditForm(member);
      }
    }
  }

  // 渲染單個成員行
  renderMemberRow(member, editingMemberId) {
    const isEditing = member.id === editingMemberId
    const avatar = member.avatar || "😊"

    return `
      <li class="member-row ${isEditing ? 'editing' : 'clickable'}" data-member-id="${member.id}">
        <div class="avatar" title="點擊更換表情符號">${avatar}</div>
        <span class="member-name">${member.name}</span>
        ${isEditing
          ? `<div class="edit-actions">
              <button class="btn save-btn">Save</button>
              <button class="btn cancel-btn">Cancel</button>
            </div>`
          : `<div class="member-actions">
              <button class="btn edit-btn">Edit</button>
              <button class="btn remove-btn">Remove</button>
            </div>`
        }
      </li>
    `;
  }

  // 設置編輯表單
  setupEditForm(member) {
    const memberRow = this.container.querySelector(`[data-member-id="${member.id}"]`)
    if (!memberRow) return

    const nameElement = memberRow.querySelector('.member-name')
    if (!nameElement) return

    // 隱藏名稱顯示
    nameElement.style.display = 'none';

    // 檢查是否已經存在編輯表單，避免重複添加
    if (memberRow.querySelector('.member-edit-form')) return

    // 創建編輯表單
    const formHtml = `
      <div class="member-edit-form">
        <input type="text" class="input-field" value="${member.name}" placeholder="Member Name" />
      </div>
    `;

    // 插入表單
    nameElement.insertAdjacentHTML('afterend', formHtml);

    // 聚焦到輸入框
    setTimeout(() => {
      const inputField = memberRow.querySelector('.input-field');
      if (inputField) {
        inputField.focus();
        inputField.select();
      }
    }, 0);
  }

  // 清空新增成員輸入框
  clearAddMemberInput() {
    const inputField = document.querySelector('.members-section .input-field');
    if (inputField) {
      inputField.value = '';
      inputField.focus();
    }
  }
}