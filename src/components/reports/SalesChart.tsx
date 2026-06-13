import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Transaction } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SalesChartProps {
  transactions: Transaction[];
}

const SalesChart: React.FC<SalesChartProps> = ({ transactions }) => {
  const hourlySales = Array(24).fill(0); // สร้าง Array 24 ช่องสำหรับแต่ละชั่วโมง

  transactions.forEach(t => {
    const hour = new Date(t.date).getHours();
    hourlySales[hour] += t.totalAmount;
  });

  const data = {
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [
      {
        label: 'ยอดขายรายชั่วโมง',
        data: hourlySales,
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number | string) {
            return '฿' + Number(value).toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  return <Bar options={options} data={data} />;
};

export default SalesChart;