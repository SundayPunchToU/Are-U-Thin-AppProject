const store = require("../../utils/store");

Page({
  data: {
    streakDays: 0,
    weeklyTrend: [],
    badges: [],
    progressMetrics: ['体重', '体脂率'],
    timeRanges: ['最近一周', '最近一月', '最近半年'],
    currentProgressMetricIndex: 0,
    currentProgressTimeIndex: 0,
    currentHeatTimeIndex: 0,
    progressData: [],
    predictedChange: '+0.2kg',
  },

  // 初始化进度趋势数据
  initProgressData() {
    // 生成模拟的进度数据
    const progressData = [];
    const now = Date.now();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      // 模拟体重数据
      const weight = 65 + Math.random() * 2 - 1;
      // 模拟体脂率数据
      const bodyFat = 20 + Math.random() * 1 - 0.5;
      
      progressData.push({
        date: dayStr,
        weight: weight.toFixed(1),
        bodyFat: bodyFat.toFixed(1)
      });
    }
    
    this.setData({ progressData });
    
    // 初始化预测值
    this.updatePrediction();
    
    // 绘制图表
    this.drawProgressChart();
  },

  // 绘制进度趋势图表
  drawProgressChart() {
    const ctx = wx.createCanvasContext('progressChart');
    const { progressData, currentProgressMetricIndex } = this.data;
    
    if (!progressData || progressData.length === 0) return;
    
    // 设置画布尺寸
    const dpr = wx.getSystemInfoSync().pixelRatio;
    ctx.scale(dpr, dpr);
    
    // 清除画布
    ctx.clearRect(0, 0, 375, 240);
    
    // 设置图表参数
    const chartWidth = 375;
    const chartHeight = 240;
    const padding = 30;
    const usableWidth = chartWidth - 2 * padding;
    const usableHeight = chartHeight - 2 * padding;
    
    // 找到最大最小值
    let values = progressData.map(item => parseFloat(currentProgressMetricIndex === 0 ? item.weight : item.bodyFat));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    // 如果数值相同，给一个范围
    if (maxValue === minValue) {
      values = values.map(v => v + Math.random() * 0.5 - 0.25);
      values.forEach((v, i) => values[i] = v);
    }
    
    // 绘制坐标轴
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, chartHeight - padding);
    ctx.lineTo(chartWidth - padding, chartHeight - padding);
    ctx.strokeStyle = '#E5E5EA';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制网格线
    ctx.setLineWidth(0.5);
    ctx.setStrokeStyle('#F0F0F0');
    
    // 水平网格线
    for (let i = 0; i <= 4; i++) {
      const y = padding + (usableHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(chartWidth - padding, y);
      ctx.stroke();
    }
    
    // 绘制折线
    ctx.beginPath();
    ctx.setStrokeStyle('#FA725D');
    ctx.setLineWidth(3);
    
    progressData.forEach((item, index) => {
      const x = padding + (usableWidth / (progressData.length - 1)) * index;
      const value = parseFloat(currentProgressMetricIndex === 0 ? item.weight : item.bodyFat);
      const y = chartHeight - padding - ((value - minValue) / (maxValue - minValue)) * usableHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 绘制数据点
    ctx.setFillStyle('#FA725D');
    
    progressData.forEach((item, index) => {
      const x = padding + (usableWidth / (progressData.length - 1)) * index;
      const value = parseFloat(currentProgressMetricIndex === 0 ? item.weight : item.bodyFat);
      const y = chartHeight - padding - ((value - minValue) / (maxValue - minValue)) * usableHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // 绘制预测线
    if (progressData.length >= 2) {
      const firstValue = parseFloat(currentProgressMetricIndex === 0 ? progressData[0].weight : progressData[0].bodyFat);
      const lastValue = parseFloat(currentProgressMetricIndex === 0 ? progressData[progressData.length - 1].weight : progressData[progressData.length - 1].bodyFat);
      const slope = (lastValue - firstValue) / (progressData.length - 1);
      
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.setStrokeStyle('#69B8A3');
      ctx.setLineWidth(2);
      
      // 延长线
      const extendedPoints = 3; // 预测未来3个点
      for (let i = 0; i <= extendedPoints; i++) {
        const x = padding + (usableWidth / (progressData.length - 1)) * (progressData.length - 1 + i);
        const value = lastValue + slope * i;
        const y = chartHeight - padding - ((value - minValue) / (maxValue - minValue)) * usableHeight;
        
        if (i === 0) {
          ctx.moveTo(padding + (usableWidth / (progressData.length - 1)) * (progressData.length - 1), 
                    chartHeight - padding - ((lastValue - minValue) / (maxValue - minValue)) * usableHeight);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      ctx.setLineDash([]); // 重置虚线设置
    }
    
    // 提交绘制命令
    ctx.draw();
  },

  // 更新预测值
  updatePrediction() {
    const { progressData, currentProgressMetricIndex } = this.data;
    
    if (progressData.length < 2) {
      this.setData({ predictedChange: '+0.0kg' });
      return;
    }
    
    const firstValue = parseFloat(currentProgressMetricIndex === 0 ? progressData[0].weight : progressData[0].bodyFat);
    const lastValue = parseFloat(currentProgressMetricIndex === 0 ? progressData[progressData.length - 1].weight : progressData[progressData.length - 1].bodyFat);
    const change = lastValue - firstValue;
    
    let prediction;
    if (currentProgressMetricIndex === 0) { // 体重
      prediction = change > 0 ? `+${change.toFixed(1)}kg` : `${change.toFixed(1)}kg`;
    } else { // 体脂率
      prediction = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    }
    
    this.setData({ predictedChange: prediction });
  },

  // 进度指标选择变化
  onProgressMetricChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ currentProgressMetricIndex: index });
    this.drawProgressChart();
    this.updatePrediction();
  },

  // 进度时间范围选择变化
  onProgressTimeRangeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ currentProgressTimeIndex: index });
    this.initProgressData(); // 重新初始化数据
  },

  // 热量时间范围选择变化
  onHeatTimeRangeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ currentHeatTimeIndex: index });
    // 这里可以根据选择的时间范围更新热量趋势数据
    // 由于原始数据结构固定，这里暂时重新初始化
    this.setData(store.buildTrendViewModel());
  },

  onShow() {
    if (!store.getProfile()) {
      wx.reLaunch({
        url: "/pages/onboarding/index",
      });
      return;
    }

    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 2 });
    }

    const trendData = store.buildTrendViewModel();
    this.setData(trendData);
    
    // 初始化进度趋势数据
    this.initProgressData();
  },
});