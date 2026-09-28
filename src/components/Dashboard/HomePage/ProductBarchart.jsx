import React, { useRef, useEffect } from "react";
import styles from "./HomePage.module.css";
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaPlus,
  FaMinus
} from "react-icons/fa";

function ProductBarchart({ monthlyRevenue = [], productPerformance = [] }) {
  const canvasRef = useRef(null);
  const [chartType, setChartType] = React.useState('bar');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Real data or graceful zeros
  const revenueData = monthlyRevenue.length === 12 
    ? monthlyRevenue 
    : new Array(12).fill(0);

  const performanceData = Array.isArray(productPerformance) ? productPerformance : [];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (chartType === 'bar') {
      drawBarChart(ctx, revenueData, months);
    } else if (chartType === 'line') {
      drawLineChart(ctx, revenueData, months);
    } else if (chartType === 'pie') {
      drawPieChart(ctx, performanceData);
    }
  }, [chartType, revenueData, performanceData]);

  const drawBarChart = (ctx, data, labels) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data, 1000);
    const barWidth = chartWidth / data.length;
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw bars
    data.forEach((value, index) => {
      const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
      const x = padding + index * barWidth + barWidth * 0.1;
      const y = height - padding - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1D4ED8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      
      // Draw value on top of bar if > 0
      if (value > 0) {
        ctx.fillStyle = '#374151';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(`₹${(value/1000).toFixed(0)}K`, x + barWidth * 0.4, y - 5);
      }
      
      // Draw month label
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barWidth * 0.4, height - padding + 20);
    });
  };

  const drawLineChart = (ctx, data, labels) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data, 1000);
    const stepX = chartWidth / (data.length - 1);
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (maxValue > 0 ? (value / maxValue) * chartHeight : 0);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points and labels
    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (maxValue > 0 ? (value / maxValue) * chartHeight : 0);
      
      // Point
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x, height - padding + 20);
    });
  };

  const drawPieChart = (ctx, data) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0 || data.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('No product data available', centerX, centerY);
      return;
    }

    let currentAngle = 0;
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.fillStyle = item.color || '#3B82F6';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 1.2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  };

  const getGrowthRate = () => {
    if (revenueData.length < 2) return 0;
    const currentMonth = revenueData[revenueData.length - 1] || 0;
    const previousMonth = revenueData[revenueData.length - 2] || 0;
    if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;
    const growth = ((currentMonth - previousMonth) / previousMonth) * 100;
    return growth;
  };

  const growthRate = getGrowthRate();

  return (
    <div className={styles.enhancedChartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <h4>Business Analytics</h4>
          <div className={styles.growthInfo}>
            <span className={styles.growthLabel}>Monthly Growth</span>
            <span className={`${styles.growthValue} ${growthRate >= 0 ? styles.positive : styles.negative}`}>
              {growthRate >= 0 ? <FaPlus /> : <FaMinus />}
              {Math.abs(growthRate).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className={styles.chartControls}>
          <button 
            className={`${styles.chartButton} ${chartType === 'bar' ? styles.active : ''}`}
            onClick={() => setChartType('bar')}
          >
            <FaChartBar />
            Bar
          </button>
          <button 
            className={`${styles.chartButton} ${chartType === 'line' ? styles.active : ''}`}
            onClick={() => setChartType('line')}
          >
            <FaChartLine />
            Line
          </button>
          <button 
            className={`${styles.chartButton} ${chartType === 'pie' ? styles.active : ''}`}
            onClick={() => setChartType('pie')}
          >
            <FaChartPie />
            Pie
          </button>
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300}
          className={styles.chartCanvas}
        />
      </div>
    </div>
  );
}

export default ProductBarchart;
