export class TransactionDetailDialog {
  constructor() {
    this.dialog = null;
    this.currentTransactionId = null;
    this.eventHandlers = {};
    this.createDialogElement();
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

  createDialogElement() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'transaction-detail-dialog';
    document.body.appendChild(this.dialog);

    // 添加點擊外部關閉的功能
    this.dialog.addEventListener('click', (e) => {
      const dialogDimensions = this.dialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        this.dialog.close();
      }
    });
  }

  showTransactionDetail(transaction, members) {
    this.currentTransactionId = transaction.id

    // 找出交易的付款人資訊
    const payer = members.find(m => m.name === transaction.payer)
    const payerAvatar = payer ? payer.avatar || '😊' : '😊'

    // 準備參與成員列表
    const participantItems = [];

    // 如果參與者列表為空，則預設所有成員參與
    const participants = transaction.participants.length > 0
      ? transaction.participants
      : members.map(m => m.id);

    // 為每個參與成員準備顯示項目
    members.forEach(member => {
      if (participants.includes(member.id)) {
        const isPaid = transaction.paidMembers.includes(member.id);
        const isCurrentPayer = member.name === transaction.payer;

        participantItems.push(`
          <div class="participant-payment-item ${isPaid ? 'paid' : ''} ${isCurrentPayer ? 'payer' : ''}" data-member-id="${member.id}">
            <div class="participant-info">
              <span class="avatar">${member.avatar || '😊'}</span>
              <span class="name">${member.name}</span>
              ${isCurrentPayer ? '<span class="payer-badge">Payer</span>' : ''}
            </div>
            <div class="payment-status">
              ${isCurrentPayer
            ? '<span class="status-text">Auto-confirmed</span>'
            : `<button class="btn payment-toggle-btn ${isPaid ? 'confirmed' : 'unconfirmed'}">${isPaid ? 'Confirmed' : 'Confirm'}</button>`}
            </div>
          </div>
        `);
      }
    });

    // 渲染彈窗內容
    this.dialog.innerHTML = `
      <div class="dialog-header">
        <h2 class="transaction-detail-title">
          <span class="avatar">${payerAvatar}</span>
          <span>${transaction.title}</span>
        </h2>
        <button class="btn close-btn">&times;</button>
      </div>
      
      <div class="transaction-info-summary">
        <div class="info-item">
          <div class="info-label">Date</div>
          <div class="info-value">${transaction.date}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Amount</div>
          <div class="info-value">$${parseFloat(transaction.amount).toFixed(2)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Category</div>
          <div class="info-value">${transaction.category}</div>
        </div>
      </div>
      
      <div class="participants-payment-section">
        <h3 class="section-title">Confirm Payments</h3>
        <p class="section-description">Mark which members have confirmed their payment for this transaction:</p>
        
        <div class="participants-container">
          ${participantItems.length > 0
        ? participantItems.join('')
        : '<div class="no-data">No participants for this transaction.</div>'}
        </div>
      </div>
      
      <div class="payment-summary">
        <div class="summary-item">
          <span class="summary-label">Status:</span>
          <span class="summary-value">
            ${transaction.paidMembers.length} of ${participants.length} confirmed
          </span>
        </div>
      </div>
    `;

    // 綁定關閉按鈕事件
    const closeBtn = this.dialog.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dialog.close();
      });
    }

    // 綁定付款確認按鈕事件
    const paymentButtons = this.dialog.querySelectorAll('.payment-toggle-btn');
    paymentButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const parentItem = e.target.closest('.participant-payment-item');
        if (parentItem) {
          const memberId = parentItem.dataset.memberId;
          this.emit('payment-toggle-requested', {
            transactionId: this.currentTransactionId,
            memberId
          });
        }
      });
    });

    // 顯示彈窗
    this.dialog.showModal();
  }

  // 更新單個成員的付款狀態
  updateMemberPaymentStatus(memberId, isPaid) {
    const memberItem = this.dialog.querySelector(`.participant-payment-item[data-member-id="${memberId}"]`);
    if (memberItem) {
      if (isPaid) {
        memberItem.classList.add('paid');
      } else {
        memberItem.classList.remove('paid');
      }

      const button = memberItem.querySelector('.payment-toggle-btn');
      if (button) {
        button.textContent = isPaid ? 'Confirmed' : 'Confirm';
        if (isPaid) {
          button.classList.add('confirmed');
          button.classList.remove('unconfirmed');
        } else {
          button.classList.remove('confirmed');
          button.classList.add('unconfirmed');
        }
      }
    }

    // 更新摘要資訊
    this.updatePaymentSummary();
  }

  // 更新付款摘要資訊
  updatePaymentSummary() {
    const totalParticipants = this.dialog.querySelectorAll('.participant-payment-item').length;
    const confirmedParticipants = this.dialog.querySelectorAll('.participant-payment-item.paid').length;

    const summaryValue = this.dialog.querySelector('.summary-value');
    if (summaryValue) {
      summaryValue.textContent = `${confirmedParticipants} of ${totalParticipants} confirmed`;
    }
  }
}