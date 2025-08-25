/** @odoo-module **/

import { Component, onMounted, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class BankingDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        this.portfolioChartRef = useRef("portfolioChart");
        this.customerChartRef = useRef("customerChart");
        
        onMounted(() => {
            this.initializeCharts();
            this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        try {
            const data = await this.orm.call("banking.dashboard", "get_dashboard_data", []);
            this.updateCharts(data);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    initializeCharts() {
        // Portfolio Performance Chart
        if (this.portfolioChartRef.el) {
            const ctx = this.portfolioChartRef.el.getContext('2d');
            this.portfolioChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Deposits',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Loans',
                        data: [8000, 12000, 10000, 18000, 16000, 22000],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
        }

        // Customer Distribution Chart
        if (this.customerChartRef.el) {
            const ctx = this.customerChartRef.el.getContext('2d');
            this.customerChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Retail', 'Premium', 'Corporate', 'SME'],
                    datasets: [{
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            '#007bff',
                            '#28a745',
                            '#ffc107',
                            '#17a2b8'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    }

    updateCharts(data) {
        if (this.portfolioChart && data.portfolio) {
            this.portfolioChart.data.datasets[0].data = data.portfolio.deposits;
            this.portfolioChart.data.datasets[1].data = data.portfolio.loans;
            this.portfolioChart.update();
        }

        if (this.customerChart && data.customer_distribution) {
            this.customerChart.data.datasets[0].data = data.customer_distribution;
            this.customerChart.update();
        }
    }
}

BankingDashboard.template = "odoo_banking_crm.BankingDashboard";

registry.category("actions").add("banking_dashboard", BankingDashboard);

// Real-time updates
setInterval(() => {
    const dashboard = document.querySelector('.o_banking_dashboard_modern');
    if (dashboard) {
        // Add subtle animation to metric cards
        const metricCards = dashboard.querySelectorAll('.metric-card');
        metricCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }
}, 30000); // Update every 30 seconds