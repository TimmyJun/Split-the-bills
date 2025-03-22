// 負責單一專案的資料結構和基本操作
export class Project {
  constructor(id, name, members = [], transactions = [], description = "", categories = null, status = "active") {
    this.id = id
    this.name = name
    this.members = members
    this.transactions = transactions
    this.description = description
    this.createdDate = new Date()
    this.lastUpdated = new Date()
    this.categories = categories || ["Food", "Transportation", "Accommodation", "Miscellaneous", "Entertainment", "Others"]
    this.status = status
  }

  addMember(member) {
    this.members.push(member)
    this.updateTimestamp() // record the lastUpdated time
  }

  removeMember(memberId) {
    this.members = this.members.filter(m => m.id !== memberId)
    this.updateTimestamp()
  }

  updateMember(memberId, updatedData) {
    const memberIndex = this.members.findIndex(m => m.id === memberId)
    if(memberIndex !== -1) {
      this.members[memberIndex] = {
        ...this.members[memberIndex],
        ...updatedData
      }
      this.updateTimestamp()
      return true
    }
    return false
  }

  getMemberById(memberId) {
    return this.members.find(member => member.id === memberId);
  }

  getMemberByName(name) {
    return this.members.find(member => member.name === name);
  }

  addTransaction(transaction) {
    this.transactions.push(transaction)
    this.updateTimestamp()
  }

  removeTransaction(transactionId) {
    this.transactions = this.transactions.filter(t => t.id !== transactionId)
    this.updateTimestamp()
  }

  updateDescription(description) {
    this.description = description;
    this.updateTimestamp();
  }

  // 格式化日期為本地字符串
  getFormattedCreatedDate() {
    return this.createdDate.toLocaleDateString();
  }

  getFormattedLastUpdated() {
    return this.lastUpdated.toLocaleDateString() + ' ' +
      this.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  updateTimestamp() {
    this.lastUpdated = new Date();
  }

  addCategory(category) {
    if(category && !this.categories.includes(category)) {
      this.categories.push(category)
      this.updateTimestamp()
      return true
    }
    return false
  }

  updateTransaction(transactionId, updatedData) {
    const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex !== -1) {
      this.transactions[transactionIndex] = {
        ...this.transactions[transactionIndex],
        ...updatedData
      };
      this.updateTimestamp();
      return true;
    }
    return false;
  }

  updateMemberName(memberId, newName) {
    const member = this.getMemberById(memberId);
    if (!member) return false;

    const oldName = member.name;

    // 更新成員名稱
    member.name = newName;

    // 更新該成員作為付款人的所有交易
    this.transactions.forEach(transaction => {
      if (transaction.payer === oldName) {
        transaction.payer = newName;
      }
    });

    this.updateTimestamp();
    return true;
  }

  calculateMemberStats(memberId) {
    const member = this.getMemberById(memberId);
    if (!member) return null;

    // 初始化統計資料
    const stats = {
      totalPaid: 0,
      shouldPay: 0,
      balance: 0,
      categoryBreakdown: {},
      transactions: [],
      splitDetails: [],
      participatedTransactions: []
    };

    // 計算該成員支付的總額和各類別消費
    this.transactions.forEach(transaction => {
      // 計算每人份額
      const perPersonAmount = parseFloat(transaction.amount) / transaction.participants.length;

      // 記錄所有相關交易
      if (transaction.payer === member.name) {
        // 將整筆交易添加到付款交易列表
        stats.transactions.push({
          ...transaction,
          // 添加個人實際份額信息
          personalShare: perPersonAmount
        });

        stats.totalPaid += parseFloat(transaction.amount);
      }

      // 記錄該成員參與的所有交易
      if (transaction.participants.includes(memberId)) {
        // 添加交易到參與交易列表，添加個人份額信息
        stats.participatedTransactions.push({
          ...transaction,
          // 添加個人實際份額信息
          personalShare: perPersonAmount,
          // 添加交易總額
          totalAmount: parseFloat(transaction.amount)
        });

        // 計算該成員在此交易中應付的金額 (平均分配)
        stats.shouldPay += perPersonAmount;

        // 更新類別統計 - 重要改變: 無論是否為付款人，只要參與就計入類別消費
        if (!stats.categoryBreakdown[transaction.category]) {
          stats.categoryBreakdown[transaction.category] = 0;
        }
        stats.categoryBreakdown[transaction.category] += perPersonAmount;
      }
    });

    // 設置餘額
    stats.balance = stats.totalPaid - stats.shouldPay;

    // 計算分帳詳細資訊
    stats.splitDetails = this.calculateSplitDetails();

    return stats;
  }

  calculateAllMemberStats() {
    // 初始化每個成員的統計資料
    const membersStats = {};
    this.members.forEach(member => {
      membersStats[member.id] = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        paid: 0,
        shouldPay: 0,
        balance: 0,
        participatedTransactions: [] // 成員參與的交易列表
      };
    });

    // 計算每個交易的分攤
    this.transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount)
      const payer = this.members.find(m => m.name === transaction.payer)

      if (payer) {
        membersStats[payer.id].paid += amount
      }

      // 計算參與者應付金額
      const participants = transaction.participants.length > 0
        ? transaction.participants
        : this.members.map(m => m.id); // 如果沒有指定參與者，則所有成員平分

      const perPersonExpense = amount / participants.length;

      participants.forEach(participantId => {
        if (membersStats[participantId]) {
          membersStats[participantId].shouldPay += perPersonExpense;
          membersStats[participantId].participatedTransactions.push(transaction.id);
        }
      });
    });

    // 計算每個成員的餘額
    for (const id in membersStats) {
      membersStats[id].balance = membersStats[id].paid - membersStats[id].shouldPay;
    }

    // 計算總支出
    const totalExpense = this.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalExpense,
      membersStats
    }
  }

  calculateSplitDetails() {
    const stats = this.calculateAllMemberStats();
    const settlements = [];

    // 將成員分為債務人和債權人
    const debtors = [];
    const creditors = [];

    Object.values(stats.membersStats).forEach(memberStat => {
      // 計算實際餘額，考慮已付款狀態
      const actualBalance = this.calculateActualBalance(memberStat);

      if (actualBalance < -0.01) { // 負餘額，是債務人
        debtors.push({
          ...memberStat,
          remainingDebt: Math.abs(actualBalance)
        });
      } else if (actualBalance > 0.01) { // 正餘額，是債權人
        creditors.push({
          ...memberStat,
          remainingCredit: actualBalance
        })
      }
    })

    // 解決債務，債務人向債權人付錢
    debtors.forEach(debtor => {
      let remainingDebt = debtor.remainingDebt

      // 當還有債務且有債權人可收錢時
      for (let i = 0; i < creditors.length && remainingDebt > 0.01; i++) {
        const creditor = creditors[i]
        if (creditor.remainingCredit < 0.01) continue

        // 計算本次還款金額
        const amount = Math.min(remainingDebt, creditor.remainingCredit)
        if (amount > 0.01) {
          // 檢查此人對此債權人的付款狀態
          const alreadyPaid = this.isPaymentConfirmed(debtor.id, creditor.id)

          // 只有未付款的才添加到結算列表
          if (!alreadyPaid) {
            // 添加還款記錄
            settlements.push({
              from: debtor.id,
              fromName: debtor.name,
              fromAvatar: debtor.avatar,
              to: creditor.id,
              toName: creditor.name,
              toAvatar: creditor.avatar,
              amount: parseFloat(amount.toFixed(2))
            })
          }

          // 更新餘額
          remainingDebt -= amount;
          creditor.remainingCredit -= amount
        }
      }
    })

    return settlements
  }

  updateStatus(status) {
    if (status === "active" || status === "closed") {
      this.status = status
      this.updateTimestamp()
      return true
    }
    return false
  }

  isEditable() {
    return this.status === "active"
  }

  calculateActualBalance(memberStat) {
    let actualBalance = memberStat.balance

    // 調整已確認付款的金額
    this.transactions.forEach(transaction => {
      // 如果成員是參與者且已確認付款，但計算中尚未減去
      if (transaction.participants.includes(memberStat.id) &&
        transaction.paidMembers.includes(memberStat.id) &&
        transaction.payer !== memberStat.name) {

        // 該成員在此交易中的份額已經付款，但餘額計算可能尚未反映
        const perPersonAmount = parseFloat(transaction.amount) / transaction.participants.length;
      }
    })

    return actualBalance
  }

  isPaymentConfirmed(fromMemberId, toMemberId) {
    const relevantTransactions = this.transactions.filter(transaction => {
      const memberIsPayer = this.getMemberById(toMemberId) &&
        this.getMemberById(toMemberId).name === transaction.payer
      const fromMemberIsParticipant = transaction.participants.includes(fromMemberId)

      return memberIsPayer && fromMemberIsParticipant;
    })

    // 檢查在所有相關交易中，fromMemberId 是否都確認了付款
    if (relevantTransactions.length === 0) return false

    // 對於每筆交易，檢查 fromMemberId 是否在已付款名單中
    return relevantTransactions.every(transaction =>
      transaction.paidMembers && transaction.paidMembers.includes(fromMemberId)
    )
  }
}