export class MemberDetailDialog {
  constructor() {
    this.dialog = null;
    this.currentMemberId = null;
    this.createDialogElement();
  }

  createDialogElement() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'member-detail-dialog';
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

  showMemberDetail(member, memberStats) {
    this.currentMemberId = member.id;

    // 計算分類消費數據
    const categoryItems = Object.entries(memberStats.categoryBreakdown)
      .map(([category, amount]) => `
        <div class="category-item">
          <span class="category-name">${category}</span>
          <span class="category-amount">$${amount.toFixed(2)}</span>
        </div>
      `).join('')

    // 計算交易記錄
    const transactionItems = memberStats.transactions
      .map(transaction => `
        <div class="transaction-item">
          <div class="transaction-left">
            <div class="transaction-title">${transaction.title}</div>
            <div class="transaction-date">${transaction.date}</div>
          </div>
          <div class="transaction-right">
            <div class="transaction-amount">$${parseFloat(transaction.amount).toFixed(2)}</div>
            <div class="transaction-category">${transaction.category}</div>
          </div>
        </div>
      `).join('')

    const receiveFromOthers = []
    const payToOthers = []

    memberStats.splitDetails.forEach(settlement => {
      if (settlement.from === member.id) {
        // 此成員需要支付給別人
        payToOthers.push({
          name: settlement.toName,
          avatar: settlement.toAvatar,
          amount: settlement.amount
        })
      } else if (settlement.to === member.id) {
        // 此成員應該收到別人的款項
        receiveFromOthers.push({
          name: settlement.fromName,
          avatar: settlement.fromAvatar,
          amount: settlement.amount
        })
      }
    })

    // 計算分帳明細
    // const filteredSettlements = memberStats.splitDetails.filter(
    //   s => s.from === member.id || s.to === member.id
    // );

    // const settlementItems = filteredSettlements
    //   .map(settlement => {
    //     if (settlement.from === member.id) {
    //       return `
    //         <div class="settlement-item outgoing">
    //           <div class="settlement-person">
    //             <span class="avatar">${settlement.toAvatar}</span>
    //             <span>${settlement.toName}</span>
    //           </div>
    //           <div class="settlement-amount">
    //             <span class="pay-text">Should pay</span>
    //             <span class="amount">$${settlement.amount.toFixed(2)}</span>
    //           </div>
    //         </div>
    //       `;
    //     } else {
    //       return `
    //         <div class="settlement-item incoming">
    //           <div class="settlement-person">
    //             <span class="avatar">${settlement.fromAvatar}</span>
    //             <span>${settlement.fromName}</span>
    //           </div>
    //           <div class="settlement-amount">
    //             <span class="receive-text">Should receive</span>
    //             <span class="amount">$${settlement.amount.toFixed(2)}</span>
    //           </div>
    //         </div>
    //       `;
    //     }
    //   }).join('');

    // 創建結算摘要 HTML
    let settlementSummaryHTML = '';

    if (payToOthers.length === 0 && receiveFromOthers.length === 0) {
      settlementSummaryHTML = `<div class="no-data">You don't have to do anything for now.</div>`;
    } else {
      // 創建「應付款項」部分
      if (payToOthers.length > 0) {
        settlementSummaryHTML += `
          <div class="settlement-section outgoing">
            <h4 class="settlement-section-title">Accounts payable</h4>
            <div class="settlement-items-container">
              ${payToOthers.map(item => `
                <div class="settlement-item outgoing">
                  <div class="settlement-person">
                    <span class="avatar">${item.avatar}</span>
                    <span class="person-name">You have to pay to ${item.name}</span>
                  </div>
                  <div class="settlement-amount">
                    <span class="amount">$${item.amount.toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      // 創建「應收款項」部分
      if (receiveFromOthers.length > 0) {
        settlementSummaryHTML += `
          <div class="settlement-section incoming">
            <h4 class="settlement-section-title">Accounts receivable</h4>
            <div class="settlement-items-container">
              ${receiveFromOthers.map(item => `
                <div class="settlement-item incoming">
                  <div class="settlement-person">
                    <span class="avatar">${item.avatar}</span>
                    <span class="person-name">You should receive from ${item.name}</span>
                  </div>
                  <div class="settlement-amount">
                    <span class="amount">$${item.amount.toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    // 渲染彈窗內容
    this.dialog.innerHTML = `
      <div class="dialog-header">
        <h2 class="member-detail-title">
          <span class="avatar">${member.avatar || '😊'}</span>
          <span>${member.name}'s details</span>
        </h2>
        <button class="btn close-btn">&times;</button>
      </div>
      
      <div class="member-stats-summary">
        <div class="stats-item">
          <div class="stats-label">You've paid</div>
          <div class="stats-value">$${memberStats.totalPaid.toFixed(2)}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Amount per capita</div>
          <div class="stats-value">$${memberStats.shouldPay.toFixed(2)}</div>
        </div>
        <div class="stats-item ${memberStats.balance >= 0 ? 'positive' : 'negative'}">
          <div class="stats-label">${memberStats.balance >= 0 ? 'accounts receivable' : 'Amount payable'}</div>
          <div class="stats-value">$${Math.abs(memberStats.balance).toFixed(2)}</div>
        </div>
      </div>
      
      <div class="member-detail-section">
        <h3 class="section-title">Result</h3>
        <div class="settlements-container">
          ${settlementSummaryHTML || '<div class="no-data">There is no transaction needs to be processed currently</div>'}
        </div>
      </div>
      
      <div class="member-detail-section">
        <h3 class="section-title">Category expenses</h3>
        <div class="categories-container">
          ${categoryItems || '<div class="no-data">There is no transaction records currently</div>'}
        </div>
      </div>
      
      <div class="member-detail-section">
        <h3 class="section-title">Transaction records</h3>
        <div class="transactions-container">
          ${transactionItems || '<div class="no-data">There is no transaction records currently</div>'}
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

    // 顯示彈窗
    this.dialog.showModal();
  }
}