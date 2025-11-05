import {HttpUtils} from "../utils/http-utils";
import {OperationsService} from "../services/operations-service";
import {Chart} from "chart.js/auto";

export function periodSelectButtonsProcessing() {
    const today = new Date();
    this.periodBarElementsArray.forEach((element) => {
        element.classList.remove('btn-secondary');
        element.classList.add('btn-outline-secondary');
        if (element.id === this.period) {
            element.classList.add('btn-secondary');
            element.classList.remove('btn-outline-secondary');
        }
        if (this.period === 'interval' && this.dateFromElement && this.dateToElement && this.IntervalDurationDivElement) {
            this.IntervalDurationDivElement.classList.remove('d-none');
            this.IntervalDurationDivElement.classList.add('d-flex');
            this.dateFromElement.disabled = false;
            this.dateToElement.disabled = false;
            this.dateFromElement.value = (new Date(today.getFullYear(), 0, 2)).toISOString().slice(0, 10);
            this.dateToElement.value = (new Date(today.getFullYear(), today.getMonth() + 1, 1)).toISOString().slice(0, 10);
        }
    });
}

export class MainPage {
    constructor() {
        this.type = {
            income: 'income',
            expense: 'expense',
        }
        this.period = 'today';
        this.totalIncomesSpanElement = document.getElementById("total-incomes");
        this.totalExpensesSpanElement = document.getElementById("total-expenses");
        this.periodBarElementsArray = document.querySelectorAll('.period-selection a');
        this.IntervalDurationDivElement = document.getElementById('interval-duration');
        this.dateFromElement = document.getElementById('dateFrom');
        this.dateToElement = document.getElementById('dateTo');
        this.getOperations = OperationsService.getOperations;
        this.init().then();
    }


    async init() {
        let currentPeriod = new URLSearchParams(location.search).get('period');
        this.period = currentPeriod ? currentPeriod : 'today';
        periodSelectButtonsProcessing.call(this);
        const operations = await this.getOperations(this.period, this.dateFromElement, this.dateToElement);
        this.loadCharts(operations).then();
        if (this.dateFromElement) {
            this.dateFromElement.addEventListener('change', this.intervalChangedEventListenerFunc.bind(this));
        }
        if (this.dateToElement) {
            this.dateToElement.addEventListener('change', this.intervalChangedEventListenerFunc.bind(this));
        }
    };


    async intervalChangedEventListenerFunc() {
        this.incomesChart.destroy();
        this.expensesChart.destroy();
        const balance = await this.getOperations(this.period, this.dateFromElement, this.dateToElement);
        this.loadCharts(balance).then();
    };


    async getCategoryAggregation(data, type) {
        let categoriesRequestResult = await HttpUtils.request(`/categories/` + type);
        console.log(categoriesRequestResult.response);
        const categoriesObject = {};
        const myArray = categoriesRequestResult.toString().split('')
        myArray.response?.forEach((element) => categoriesObject[element.title] = element.id);
        const total = data.reduce((acc, cur) => acc + cur.amount, 0);
        const result = data.reduce((acc, cur) => {
            acc[cur.category] = cur.amount + (acc[cur.category] || 0);
            return acc;
        }, {});
        let resultArray = Object.keys(result).map(key => [key, result[key], categoriesObject[key]]);
        resultArray.sort((a, b) => a[2] - b[2]);
        return {
            labels: resultArray.map(item => item[0]),
            amounts: resultArray.map(item => item[1]),
            total: total
        };
    };


    async loadCharts(operations) {
        if (operations) {
            const operationsArray = Object.values(operations);
            const incomes = await this.getCategoryAggregation(operationsArray.filter(element => element.type === 'income'), 'income');
            const expenses = await this.getCategoryAggregation(operationsArray.filter(element => element.type === 'expense'), 'expense');


            const incomesCanvasElement = document.getElementById('incomes-chart').getContext('2d');
            const expensesCanvasElement = document.getElementById('expenses-chart').getContext('2d');
            const CHART_COLORS = {
                red: '#DC3545',
                orange: '#FD7E14',
                yellow: '#FFC107',
                green: '#20C997',
                blue: '#0D6EFD',
                purple: 'rgb(153, 102, 255)',
                grey: 'rgb(201, 203, 207)',
                pink: 'rgb(170,68,120)',
                brown: 'rgb(73,9,9)',
            };

            const numberOfColors = Math.max(incomes.amounts.length, expenses.amounts.length) - 9;
            for (let i = 0; i < numberOfColors; i++) {
                CHART_COLORS['color' + i] = `rgb(${rand(0, 255)}, ${rand(0, 255)}, ${rand(0, 255)})`;
            }

            function rand(frm, to) {
                return ~~(Math.random() * (to - frm)) + frm;
            }

            const incomesData = {
                labels: incomes.labels,
                datasets: [
                    {
                        label: 'Доходы',
                        data: incomes.amounts,
                        backgroundColor: Object.values(CHART_COLORS),
                    }
                ]
            };
            const expensesData = {
                labels: expenses.labels,
                datasets: [
                    {
                        label: 'Расходы',
                        data: expenses.amounts,
                        backgroundColor: Object.values(CHART_COLORS),
                    }
                ],
            };
            const incomesConfig = {
                type: 'pie',
                data: incomesData,
                options: {
                    radius: '90%',
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false,
                            text: 'Доходы'
                        }
                    }
                },
            };
            const expensesConfig = {
                type: 'pie',
                data: expensesData,
                options: {
                    radius: '90%',
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false,
                            text: 'Расходы'
                        }
                    }
                },
            };
            if (this.totalIncomesSpanElement) {
                this.totalIncomesSpanElement.innerText = incomes.total.toLocaleString() + ' $';
            }
            if (this.totalExpensesSpanElement) {
                this.totalExpensesSpanElement.innerText = expenses.total.toLocaleString() + ' $';
            }
            this.incomesChart = new Chart(incomesCanvasElement, incomesConfig);
            this.expensesChart = new Chart(expensesCanvasElement, expensesConfig);
        }
    };

}