import { ProjectManager } from "../models/projectManager.js"
import { SettingDialog } from "../views/components/settingDialog.js"
import { Member } from "../models/member.js"
import { MemberListView } from "../views/components/memberListView.js"
import { EmojiPickerView } from "../views/components/emojiPickerView.js"
import { TransactionListView } from "../views/components/transactionListView.js"
import { Transaction } from "../models/transaction.js"
import { MemberDetailDialog } from "../views/components/memberDetailDialog.js"
import { ChartView } from "../views/components/chartView.js"
import { ProjectStatusView } from "../views/components/projectStatusView.js"

export class AppController {
  constructor() {
    this.projectManager = new ProjectManager()
    this.dialogView = new SettingDialog()
    this.editingMemberId = null
    this.memberListView = new MemberListView(document.querySelector('.member-list'))
    this.emojiPickerView = new EmojiPickerView()
    this.transactionListView = new TransactionListView(document.querySelector('.expense-list'))
    this.memberDetailDialog = new MemberDetailDialog()
    this.chartView = new ChartView(document.querySelector('.chart-placeholder'))
    this.currentChartType = 'category'
    this.projectStatusView = new ProjectStatusView()
    this.setupEventListeners()
    this.initialize()
  }

  initialize() {
    if (this.projectManager.projects.length === 0) {
      // New user - show create project dialog
      this.resetUI()
      this.showNewProjectDialog();
    } else {
      // Existing user - load most recent project
      this.updateUI();
    }

    // 設定日期輸入框為今天
    const dateInput = document.querySelector('.transactions-section input[type="date"]');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  setupEventListeners() {
    // dialog事件
    const settingBtn = document.querySelector('.setting-btn')
    settingBtn.onclick = () => this.showProjectListDialog()

    // 會員事件
    this.memberListView.initEventListeners()

    // 交易事件
    this.transactionListView.initEventListeners()

    // MemberLIstVIew發出的事件
    this.memberListView
      .on('member-add-requested', data => this.handleAddMember(data.name))
      .on('member-remove-requested', data => this.handleRemoveMember(data.name))
      .on('member-edit-requested', data => this.startEditingMember(data.id))
      .on('member-save-requested', data => this.saveEditingMember(data.id, data.name))
      .on('member-edit-cancelled', () => this.cancelEditingMember())
      .on('avatar-click', data => this.handleAvatarClick(data.id))
      .on('member-details-requested', data => this.showMemberDetails(data.id))
    
    // emoji事件
    this.emojiPickerView
      .on('emoji-selected', data => this.handleEmojiSelected(data.memberId, data.emoji))

    // 交易列表事件
    this.transactionListView
      .on('transaction-add-requested', () => this.handleAddTransaction())
      .on('transaction-remove-requested', data => this.handleRemoveTransaction(data.id))
      .on('transaction-edit-requested', data => this.handleEditTransaction(data.id))
      .on('transaction-save-requested', data => this.handleSaveTransaction(data))
      .on('transaction-edit-cancelled', data => this.handleCancelEdit(data.id))

    this.projectStatusView
      .on('status-change-requested', data => this.handleProjectStatusChange(data.status))
    
    this.setupChartSectionEvents()
  }

  showMemberDetails(memberId) {
    const currentProject = this.projectManager.currentProject
    if (!currentProject) return

    const member = currentProject.getMemberById(memberId)
    if (!member) return

    // 計算該成員的消費統計
    const memberStats = currentProject.calculateMemberStats(memberId)

    // 顯示成員詳情對話框
    this.memberDetailDialog.showMemberDetail(member, memberStats)
  }

  showNewProjectDialog() {
    this.dialogView.showNewProjectDialog(async (name, description) => {
      this.projectManager.createProject(name, description)
      this.updateUI()
    })
  }

  showProjectListDialog() {
    if (this.projectManager.projects.length === 0) {
      this.showNewProjectDialog()
      return
    }

    this.dialogView.showProjectListDialog(
      this.projectManager.projects,
      this.projectManager.currentProject?.id,
      async (projectId, action, newName, newDescription) => {
        if (action === 'delete') {
          const isAllProjectsDeleted = this.projectManager.deleteProject(projectId)
          this.resetUI()

          if (isAllProjectsDeleted) {
            setTimeout(() => {
              this.showNewProjectDialog()
            }, 0)
          } else {
            this.updateUI()
          }
        } else if (action === 'select') {
          this.projectManager.switchProject(projectId)
          this.updateUI()
        } else if (action === "edit") {
          this.projectManager.updateProjectName(projectId, newName)

          if (newDescription !== undefined) {
            this.projectManager.updateProjectDescription(projectId, newDescription)
          }
          // 如果正在編輯當前項目，更新 UI
          if (this.projectManager.currentProject?.id === projectId) {
            this.updateUI()
          }
        }
      },
      () => this.showNewProjectDialog()
    );
  }

  resetUI() {
    // 清空所有相關的 UI 元素
    document.querySelector('.project-title').textContent = ''
    document.querySelector('.project-created').textContent = ''
    document.querySelector('.project-updated').textContent = ''
    document.querySelector('.project-description').textContent = 'No description'
    document.querySelector('.member-list').innerHTML = ''
    document.querySelector('.expense-list').innerHTML = ''
    document.querySelector('.add-expense-group select').innerHTML = '<option value="">payer</option>'

    const chartPlaceholder = document.querySelector('.chart-placeholder')
    if (chartPlaceholder) {
      chartPlaceholder.innerHTML = ''
    }
  }

  updateUI() {
    if (this.transactionListView.isEditing()) {
      return
    }

    const project = this.projectManager.currentProject
    if (!project) {
      this.resetUI()
      return
    } else {
      // Update project name
      document.querySelector('.project-title').textContent = project.name
      document.querySelector('.project-created').textContent = project.getFormattedCreatedDate()
      document.querySelector('.project-updated').textContent = project.getFormattedLastUpdated()

      // 處理描述顯示，並為過長描述設置標題屬性
      const descriptionElement = document.querySelector('.project-description')
      const description = project.description || 'No Description'
      descriptionElement.textContent = description

      // 設置完整描述的標題屬性
      if (description.length > 30) {
        descriptionElement.setAttribute('title', description);
      } else {
        descriptionElement.removeAttribute('title');
      }

      // update badge status
      const badgeElement = document.querySelector('.project-badge')
      if (badgeElement) {
        badgeElement.textContent = project.status
        badgeElement.className = `project-badge status-${project.status}`

        // 確保事件監聽只初始化一次
        if (!badgeElement.hasInitializedStatusEvents) {
          this.projectStatusView.initEventListeners(badgeElement)
          badgeElement.hasInitializedStatusEvents = true
        }
      }

      // 根據專案狀態更新UI可編輯性
      this.projectStatusView.updateUIForProjectStatus(project.isEditable())

      // 如果專案已關閉，退出編輯模式
      if (!project.isEditable() && this.editingMemberId) {
        this.cancelEditingMember()
      }


      // Update member list
      this.memberListView.render(project.members, this.editingMemberId)

      // Update transaction list
      this.transactionListView.render(project.transactions, project.members)

      // Update payer select options
      this.transactionListView.updatePayerSelect(project.members)

      // 更新參與成員選擇區域
      this.transactionListView.updateParticipantsSelection(project.members)

      // update category selector
      this.transactionListView.updateCategorySelect(project.categories)

      // update chart
      this.updateChartView()
    }
  }

  handleAddMember() {
    if (this.editingMemberId) return

    const currentProject = this.projectManager.currentProject

    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot add members.")
      return
    }

    const inputField = document.querySelector('.members-section .input-field')
    const memberName = inputField.value.trim()

    if (!memberName) {
      alert("Please enter the name of member");
      return;
    }

    // 檢查是否已有同名成員
    if (currentProject.members.some(m => m.name === memberName)) {
      alert('This member is already in the list');
      return;
    }

    // 建立新成員並添加到專案
    const newMember = new Member(Date.now().toString(), memberName)
    currentProject.addMember(newMember)

    // 保存專案變更
    this.projectManager.saveProjects()

    // 更新 UI
    this.updateUI()

    // 清空輸入欄位並聚焦
    this.memberListView.clearAddMemberInput()
  }

  handleRemoveMember(memberName) {
    if (this.editingMemberId) return

    if (!confirm(`Are you sure you want to remove ${memberName} ?`)) {
      return
    }

    const currentProject = this.projectManager.currentProject
    const memberToRemove = currentProject.members.find(m => m.name === memberName)

    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot remove members.")
      return
    }

    if (memberToRemove) {
      // 檢查該成員是否參與了任何交易
      const involvedInTransactions = currentProject.transactions.some(t => t.payer === memberName)

      if (involvedInTransactions) {
        alert(`Cannot removed ${memberName} since he's involved in the current project`)
        return
      }

      // 移除成員
      currentProject.removeMember(memberToRemove.id)

      // 保存專案變更
      this.projectManager.saveProjects()

      // 更新 UI
      this.updateUI()
    }
  }

  startEditingMember(memberId) {
    const currentProject = this.projectManager.currentProject

    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot edit members.")
      return
    }

    this.editingMemberId = memberId;
    this.updateUI();
  }

  saveEditingMember(memberId, newName) {
    const currentProject = this.projectManager.currentProject;
    const member = currentProject.getMemberById(memberId);

    if (!member) return;

    // 驗證新名稱
    if (!newName) {
      alert('成員名稱不能為空');
      return;
    }

    // 檢查名稱是否重複 (排除當前成員)
    const isDuplicate = currentProject.members.some(m =>
      m.id !== memberId && m.name.toLowerCase() === newName.toLowerCase()
    );

    if (isDuplicate) {
      alert('已存在相同名稱的成員');
      return;
    }

    // 更新成員名稱
    currentProject.updateMemberName(memberId, newName)
    const oldName = member.name

    currentProject.transactions.forEach(transaction => {
      if (transaction.payer === oldName) {
        transaction.payer = newName
      }
    })

    // 保存項目變更
    this.projectManager.saveProjects();

    // 清除編輯狀態
    this.editingMemberId = null;

    // 更新 UI
    this.updateUI();
  }

  cancelEditingMember() {
    this.editingMemberId = null;
    this.updateUI();
  }

  getMemberAvatar(memberName) {
    const project = this.projectManager.currentProject;
    if (!project) return "😊";

    const member = project.members.find(m => m.name === memberName);
    return member ? member.avatar || "😊" : "😊";
  }

  handleAvatarClick(memberId) {
    if (this.editingMemberId) return; // 如果正在編輯，不處理頭像點擊

    // 顯示 emoji 選擇器
    this.emojiPickerView.show(memberId);
  }

  handleEmojiSelected(memberId, emoji) {
    const currentProject = this.projectManager.currentProject;
    if (!currentProject) return;

    // 更新成員頭像
    currentProject.updateMember(memberId, { avatar: emoji });

    // 保存專案變更
    this.projectManager.saveProjects();

    // 更新 UI
    this.updateUI();
  }

  handleAddTransaction() {
    // 檢查是否正在編輯成員
    if (this.editingMemberId) return

    const currentProject = this.projectManager.currentProject

    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot add transactions.")
      return
    }

    if (this.transactionListView.isEditing()) {
      alert('Please finish editing the current transaction first.');
      return;
    }

    // 驗證表單數據
    const formData = this.transactionListView.validateAndCollectFormData()
    if (!formData) return

    // 獲取付款人名稱
    const payer = currentProject.getMemberById(formData.payerId)
    if (!payer) {
      alert("Couldn't find the payer");
      return;
    }

    // 如果是新的自定義分類，添加到專案的分類列表中
    if (formData.isNewCategory && formData.category) {
      currentProject.addCategory(formData.category)
    }

    // 創建新交易
    const transaction = new Transaction(
      Date.now().toString(),
      formData.title,
      formData.date,
      formData.amount,
      payer.name,
      formData.category,
      formData.participants
    )

    // 添加到項目
    currentProject.addTransaction(transaction)

    // 保存項目變更
    this.projectManager.saveProjects()

    // 清空輸入欄位
    this.transactionListView.clearAddTransactionInputs()

    // 更新 UI
    this.updateUI()
  }

  handleRemoveTransaction(transactionId) {
    // 檢查是否正在編輯成員
    if (this.editingMemberId) return

    const currentProject = this.projectManager.currentProject

    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot remove transactions.")
      return
    }

    if (this.transactionListView.isEditing()) {
      alert('Please finish editing the current transaction first.');
      return;
    }

    const transaction = currentProject.transactions.find(t => t.id === transactionId)

    if (!transaction) return

    if (!confirm(`Are you sure you want to delete「${transaction.title}」？`)) {
      return
    }

    // 從項目中移除交易
    currentProject.removeTransaction(transactionId)

    // 保存項目變更
    this.projectManager.saveProjects()

    // 更新 UI
    this.updateUI()
  }

  handleEditTransaction(transactionId) {
    const currentProject = this.projectManager.currentProject
    if (!currentProject || !currentProject.isEditable()) {
      alert("Project is closed. You cannot edit transactions.")
      return
    }

    // 找到要編輯的交易
    const transaction = currentProject.transactions.find(t => t.id === transactionId)
    if (!transaction) {
      alert('Transaction not found')
      return
    }

    // 讓視圖層處理編輯界面的顯示
    this.transactionListView.startEditing(transaction, currentProject.members)
  }

  handleSaveTransaction(data) {
    const currentProject = this.projectManager.currentProject
    if (!currentProject) return

    // 找到要編輯的交易
    const transaction = currentProject.transactions.find(t => t.id === data.id);
    if (!transaction) {
      alert('Transaction not found');
      return;
    }

    // 找到付款人
    const payer = currentProject.getMemberById(data.payerId);
    if (!payer) {
      alert("Couldn't find the payer");
      return;
    }

    // 檢查是否需要添加新分類
    if (data.isNewCategory && data.category) {
      currentProject.addCategory(data.category);
    }

    // 更新交易數據
    transaction.title = data.title
    transaction.date = data.date
    transaction.amount = data.amount
    transaction.payer = payer.name
    transaction.category = data.category
    transaction.participants = data.participants || []

    // 保存項目變更
    this.projectManager.saveProjects();

    // 更新 UI
    this.updateUI();
  }

  handleCancelEdit() {
    // 直接更新 UI 恢復原始顯示
    this.updateUI();
  }

  setupChartSectionEvents() {
    // 創建圖表類型切換按鈕
    const chartSection = document.querySelector('.chart-section .card')
    const controlsHtml = `
    <div class="chart-controls">
      <select class="chart-type-select input-field">
        <option value="category">支出分類統計</option>
        <option value="member">成員支付情況</option>
        <option value="time">支出時間趨勢</option>
        <option value="settlement">結算方案</option>
      </select>
    </div>
  `

    // 在標題後插入控制項
    const sectionTitle = chartSection.querySelector('.section-title')
    sectionTitle.insertAdjacentHTML('afterend', controlsHtml)

    // 監聽圖表類型變更
    const chartTypeSelect = chartSection.querySelector('.chart-type-select')
    if (chartTypeSelect) {
      chartTypeSelect.addEventListener('change', (e) => {
        this.currentChartType = e.target.value
        this.updateChartView()
      })
    }
  }

  updateChartView() {
    const currentProject = this.projectManager.currentProject
    if (!currentProject) return

    try {
      // 收集圖表所需的數據
      const chartData = this.prepareChartData(currentProject)
      // 檢查圖表容器是否存在
      const chartContainer = document.querySelector('.chart-placeholder')
      if (!chartContainer) {
        console.error('Chart container not found')
        return
      }

      // 如果 chartView 不存在或已被破壞，重新創建
      if (!this.chartView || !this.chartView.container) {
        this.chartView = new ChartView(chartContainer)
      }
      // 根據選擇的圖表類型更新視圖
      this.chartView.switchChartType(this.currentChartType, chartData)
    }catch(error) {
      console.error('Error updating chart view:', error)
    }
  }

  prepareChartData(project) {
    // 計算分類統計
    const categoryStats = {}
    let totalExpense = 0

    project.transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount)
      totalExpense += amount

      const category = transaction.category || "其他"
      if (!categoryStats[category]) {
        categoryStats[category] = 0
      }
      categoryStats[category] += amount
    })

    // 計算成員統計和結算方案
    const memberStats = project.calculateAllMemberStats()
    const settlements = project.calculateSplitDetails()

    return {
      categoryStats,
      totalExpense,
      membersStats: memberStats.membersStats,
      transactions: project.transactions,
      settlements: settlements
    }
  }

  handleProjectStatusChange(status) {
    const currentProject = this.projectManager.currentProject
    if (!currentProject) return

    // 更新專案狀態
    this.projectManager.updateProjectStatus(currentProject.id, status)

    // 更新UI
    this.updateUI()
  }
}