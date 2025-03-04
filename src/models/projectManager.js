import { Project } from "./project.js"

// 管理所有專案，處理專案的創建、切換和持久化儲存
export class ProjectManager {
  constructor() {
    this.projects = []
    this.currentProject = null
    this.loadProjects()
  }

  loadProjects() {
    const savedProjects = localStorage.getItem("projects")
    if (savedProjects) {
      // 將 localStorage 取得的 JSON 字串轉換為JavaScript 陣列
      // 將 p 物件的所有屬性賦值給 project後return用map建立一個新的array
      this.projects = JSON.parse(savedProjects).map(p => {
        const project = new Project()
        Object.assign(project, p)
        project.lastUpdated = new Date(p.lastUpdated)
        if(p.createdDate) {
          project.createdDate = new Date(p.createdDate)
        }else {
          // 針對舊數據，如果沒有創建日期，則使用最後更新時間
          project.createdDate = new Date(p.lastUpdated)
        }

        if (project.transactions) {
          project.transactions.forEach(transaction => {
            if (!transaction.participants) {
              transaction.participants = []
            }
            if (!transaction.paidMembers) {
              transaction.paidMembers = []
            }
          })
        }
        
        return project
      })
      this.currentProject = this.getMostRecentProject()
    }
  }


  saveProjects() {
    if (this.projects.length === 0) {
      localStorage.removeItem('projects') // 當沒有專案時，清除 localStorage
    } else {
      localStorage.setItem('projects', JSON.stringify(this.projects))
    }
  }

  createProject(name, description = "") {
    if(this.isProjectNameExists(name)) {
      throw new Error('A project with this name already exists')
    }
    const project = new Project(Date.now().toString(), name, [], [], description)
    this.projects.push(project)
    this.currentProject = project
    this.saveProjects()
    return project
  }

  getMostRecentProject() {
    // 相減得到時間差，若 b 的 lastUpdated 比 a 新，則回傳正數，b 會排在 a 前面，取array第一筆資料就會是最近更新的專案
    return this.projects.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))[0] || null
  }

  switchProject(projectId) {
    this.currentProject = this.projects.find(p => p.id === projectId) || null
    if (this.currentProject) {
      this.currentProject.updateTimestamp()
      this.saveProjects()
    }
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId)

    if (this.projects.length === 0) {
      this.currentProject = null
    } else if (this.currentProject?.id === projectId) {
      this.currentProject = this.getMostRecentProject();
    }

    this.saveProjects()
    return this.projects.length === 0
  }

  isProjectNameExists(name, excludeId = null) {
    return this.projects.some(project => 
      project.name.toLowerCase() === name.toLowerCase() &&
      project.id !== excludeId
    )
  }

  updateProjectName(projectId, newName) {
    if(this.isProjectNameExists(newName, projectId)) {
      throw new Error('A project with this name already exists')
    }
    const project = this.projects.find(p => p.id === projectId)
    if(project) {
      project.name = newName
      project.updateTimestamp()
      this.saveProjects()
      return true
    }
    return false
  }

  updateProjectDescription(projectId, description) {
    const project = this.projects.find(p => p.id === projectId)
    if (project) {
      project.updateDescription(description)
      this.saveProjects()
      return true
    }
    return false
  }

  updateProjectStatus(projectId, status) {
    const project = this.projects.find(p => p.id === projectId)
    if (project) {
      const result = project.updateStatus(status)
      if (result) {
        this.saveProjects()
        return true
      }
    }
    return false
  }
}