export class ChartView {
  constructor(container) {
    this.container = container
    this.chartCanvas = null
    this.chart = null
    this.initCanvas()
  }

  initCanvas() {
    // 清空容器
    this.container.innerHTML = ''

    // 創建畫布
    this.chartCanvas = document.createElement('canvas')
    this.chartCanvas.id = 'project-chart'
    this.chartCanvas.width = 400
    this.chartCanvas.height = 400
    this.chartCanvas.style.display = 'block'
    this.container.appendChild(this.chartCanvas)
  }

  renderCategoryPieChart(categoryData, totalExpense) {
    if (!this.container) return

    if (!categoryData || Object.keys(categoryData).length === 0) {
      this.container.innerHTML = '<div class="no-data-message">There is no transactions</div>'
      return
    }

    Array.from(this.container.children).forEach(child => {
      if (child !== this.chartCanvas) {
        this.container.removeChild(child)
      }
    })

    // 檢查 Canvas 是否需要重建
    if (!this.chartCanvas || !this.container.contains(this.chartCanvas)) {
      this.initCanvas()
    } else {
      this.chartCanvas.style.display = 'block'
    }

    if (this.chart) {
      this.chart.destroy()
    }

    const ctx = this.chartCanvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get canvas context')
      return
    }

    // 轉換數據為Chart.js格式
    const labels = Object.keys(categoryData)
    const data = Object.values(categoryData)

    // 生成顏色
    const backgroundColor = this.generateColorArray(labels.length);

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: '消費金額',
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 15,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const percentage = (value / totalExpense * 100).toFixed(1);
                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: '支出分類統計',
            font: {
              size: 16
            }
          }
        }
      }
    })
  }

  renderMemberPaymentChart(membersStats) {
    if (!this.container) return

    if (!membersStats || Object.keys(membersStats).length === 0) {
      this.container.innerHTML = '<div class="no-data-message">There is no member info</div>'
      return;
    }

    Array.from(this.container.children).forEach(child => {
      if (child !== this.chartCanvas) {
        this.container.removeChild(child)
      }
    })

    if (!this.chartCanvas || !this.container.contains(this.chartCanvas)) {
      this.initCanvas()
    } else {
      this.chartCanvas.style.display = 'block'
    }

    if (this.chart) {
      this.chart.destroy()
    }

    const ctx = this.chartCanvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get canvas context')
      return
    }

    // 轉換數據為Chart.js格式
    const members = Object.values(membersStats);
    const labels = members.map(m => m.name);
    const paidAmounts = members.map(m => m.paid);
    const shouldPayAmounts = members.map(m => m.shouldPay);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '已支付',
            data: paidAmounts,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: '應支付',
            data: shouldPayAmounts,
            backgroundColor: 'rgba(153, 102, 255, 0.7)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: '成員支付情況',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '金額'
            }
          }
        }
      }
    })
  }

  renderTimeSeriesChart(transactions) {
    if (!this.container) return

    if (!transactions || transactions.length === 0) {
      this.container.innerHTML = '<div class="no-data-message">There is no transactions</div>'
      return
    }

    Array.from(this.container.children).forEach(child => {
      if (child !== this.chartCanvas) {
        this.container.removeChild(child)
      }
    })

    if (!this.chartCanvas || !this.container.contains(this.chartCanvas)) {
      this.initCanvas()
    } else {
      this.chartCanvas.style.display = 'block'
    }

    if (this.chart) {
      this.chart.destroy()
    }

    // 整理資料：按日期分組並合計金額
    const dateGroups = {};
    transactions.forEach(transaction => {
      if (!dateGroups[transaction.date]) {
        dateGroups[transaction.date] = 0
      }
      dateGroups[transaction.date] += parseFloat(transaction.amount)
    });

    // 排序日期
    const sortedDates = Object.keys(dateGroups).sort();
    const amounts = sortedDates.map(date => dateGroups[date]);

    const ctx = this.chartCanvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [{
          label: '每日消費金額',
          data: amounts,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: '支出時間趨勢',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '金額'
            }
          }
        }
      }
    })
  }

  renderSettlementSummary(settlements) {
    if (!this.container) return;

    if (!settlements || settlements.length === 0) {
      this.container.innerHTML = '<div class="no-data-message">尚無需要結算的資料</div>';
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (this.chartCanvas) {
      this.chartCanvas.style.display = 'none';
    }

    // 清除容器內除了canvas之外的元素
    Array.from(this.container.children).forEach(child => {
      if (child !== this.chartCanvas) {
        this.container.removeChild(child);
      }
    });

    // 創建結算摘要外層容器（可滾動）
    const summaryWrapper = document.createElement('div');
    summaryWrapper.className = 'settlement-wrapper';

    // 創建結算摘要容器
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'settlement-summary';

    // 添加標題
    const title = document.createElement('h3');
    title.className = 'settlement-title';
    title.textContent = '結算方案';
    summaryContainer.appendChild(title);

    // 創建網格布局容器
    const gridContainer = document.createElement('div');
    gridContainer.className = 'settlement-grid';

    // 按債權人分組結算（誰收錢）
    const settlementsByReceiver = {};

    settlements.forEach(settlement => {
      if (!settlementsByReceiver[settlement.to]) {
        settlementsByReceiver[settlement.to] = {
          toName: settlement.toName,
          toAvatar: settlement.toAvatar,
          items: []
        };
      }

      settlementsByReceiver[settlement.to].items.push({
        from: settlement.from,
        fromName: settlement.fromName,
        fromAvatar: settlement.fromAvatar,
        amount: settlement.amount,
        transactionTitle: settlement.transactionTitle || ''
      });
    });

    // 為每個接收者創建一個分組卡片
    Object.keys(settlementsByReceiver).forEach(receiverId => {
      const group = settlementsByReceiver[receiverId];

      // 創建接收者分組卡片
      const groupCard = document.createElement('div');
      groupCard.className = 'settlement-group-card';

      // 添加接收者標題
      const groupHeader = document.createElement('div');
      groupHeader.className = 'group-header';
      groupHeader.innerHTML = `
      <span class="receiver-avatar avatar">${group.toAvatar}</span>
      <span class="receiver-name">${group.toName} 將收到</span>
    `;
      groupCard.appendChild(groupHeader);

      // 創建支付項目列表
      const itemsList = document.createElement('div');
      itemsList.className = 'settlement-items-list';

      // 添加每個支付項目
      group.items.forEach(item => {
        const paymentItem = document.createElement('div');
        paymentItem.className = 'payment-item';

        paymentItem.innerHTML = `
        <div class="payer-info">
          <span class="payer-avatar avatar">${item.fromAvatar}</span>
          <span class="payer-name">${item.fromName}</span>
        </div>
        <div class="payment-arrow">→</div>
        <div class="payment-amount">$${item.amount.toFixed(2)}</div>
      `;

        itemsList.appendChild(paymentItem);
      });

      // 計算總額
      const totalAmount = group.items.reduce((sum, item) => sum + item.amount, 0);

      // 添加總額摘要
      const totalSummary = document.createElement('div');
      totalSummary.className = 'group-total';
      totalSummary.innerHTML = `總計: $${totalAmount.toFixed(2)}`;

      // 組裝分組卡片
      groupCard.appendChild(itemsList);
      groupCard.appendChild(totalSummary);

      // 添加到網格容器
      gridContainer.appendChild(groupCard);
    });

    // 組裝結構
    summaryContainer.appendChild(gridContainer);
    summaryWrapper.appendChild(summaryContainer);
    this.container.appendChild(summaryWrapper);

    // 如果結算項目過多，添加提示文字
    if (settlements.length > 6) {
      const scrollHint = document.createElement('div');
      scrollHint.className = 'scroll-hint';
      scrollHint.textContent = '向下滾動查看更多';
      summaryContainer.insertBefore(scrollHint, gridContainer);

      // 5秒後淡出提示
      setTimeout(() => {
        scrollHint.classList.add('fade-out');
        setTimeout(() => scrollHint.remove(), 500);
      }, 5000);
    }
  }

  generateColorArray(count) {
    // 預設顏色集
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(40, 159, 64, 0.7)',
      'rgba(210, 199, 199, 0.7)'
    ]

    // 如果顏色不夠，則生成隨機顏色
    if (count > colors.length) {
      for (let i = colors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 200 + 55)
        const g = Math.floor(Math.random() * 200 + 55)
        const b = Math.floor(Math.random() * 200 + 55)
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`)
      }
    }

    return colors.slice(0, count)
  }

  switchChartType(type, data) {
    try {
      switch (type) {
        case 'category':
          this.renderCategoryPieChart(data.categoryStats, data.totalExpense)
          break
        case 'member':
          this.renderMemberPaymentChart(data.membersStats)
          break
        case 'time':
          this.renderTimeSeriesChart(data.transactions)
          break
        case 'settlement':
          this.renderSettlementSummary(data.settlements)
          break
        default:
          this.renderCategoryPieChart(data.categoryStats, data.totalExpense)
      }
    } catch(error) {
      console.error('Error switching chart type:', error)
      if (this.container) {
      this.container.innerHTML = `<div class="error-message">圖表載入錯誤，請重試</div>`
      }
    }
  }
}