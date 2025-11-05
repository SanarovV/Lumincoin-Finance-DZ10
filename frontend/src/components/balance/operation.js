import {HttpUtils} from "../../utils/http-utils";
import {ValidationUtils} from "../../utils/validation-utils";

export class Operation {
    constructor(openNewRoute) {
        this.categoryObject = {};
        this.params = null;
        this.cancelButton = null;
        this.dateInputElement = null;
        this.proceedButton = null;
        this.amountInputElement = null;
        this.commentaryInputElement = null;
        this.validations = [];
        this.typeOptionsObject = {};
        this.categorySelectElement = null;
        this.typeSelectElement = null;
        this.period = 'today';
        this.openNewRoute = openNewRoute;
        this.categoryObject = {};
        this.currentOperation = null;
        this.init().then();
    }

    async init() {
        this.findElements();
        this.setValidations();
        this.setTypeSelectElementEventListener().then();
        this.params = new URLSearchParams(window.location.search);
        const paramsPeriod = this.params.get('period');
        if (paramsPeriod) {
            this.period = paramsPeriod;
        }
        this.cancelButton ? this.cancelButton.href = `/balance?period=${this.period}` : null;
        this.dateInputElement ? this.dateInputElement.value = new Date().toISOString().slice(0, 10) : null;
    };

    async getCategories(type) {
        const result = await HttpUtils.request('/categories/' + type, 'GET');
        console.log(result);
        return result.response;
    };

    findElements() {
        this.categorySelectElement = document.getElementById("category");
        this.typeSelectElement = document.getElementById('type');
        this.proceedButton = document.getElementById('proceed');
        this.cancelButton = document.getElementById('cancel');
        this.amountInputElement = document.getElementById('amount');
        this.dateInputElement = document.getElementById('date');
        this.commentaryInputElement = document.getElementById('commentary');
    }

    setValidations() {
        this.validations = [
            {element: this.categorySelectElement},
            {element: this.typeSelectElement},
            {element: this.amountInputElement},
            {element: this.dateInputElement},
        ];
    }

    async loadCategoryList(category, safeToObject = false) {
        if (['income', 'expense'].includes(category)) {
            const categories = await this.getCategories(category);
            categories.forEach(category => {
                const optionElement = document.createElement('option');
                optionElement.value = category.id.toString();
                optionElement.innerText = category.title;
                optionElement.classList.add('added-option-category');
                if (this.categorySelectElement) {
                    this.categorySelectElement.appendChild(optionElement);
                }
                if (safeToObject) {
                    this.categoryObject[category.title] = category.id;
                }
            });
        }
    };

    async setTypeSelectElementEventListener() {
        if (this.typeSelectElement) {
            this.typeSelectElement.addEventListener('change', (e) => {
                document.querySelectorAll('.added-option-category').forEach(item => {
                    item.remove();
                });
                this.loadCategoryList(e.target.value);
                this.categorySelectElement.value = '';
            });
        }
    };

    setInitialType(type) {
        if (!this.typeSelectElement)
            return;
        this.typeOptionsObject = {};
        for (let el of Array.from(this.typeSelectElement.children)) {
            if (el.value) {
                this.typeOptionsObject[el.value] = el;
            }
        }
        if (this.typeOptionsObject[type]) {
            this.typeOptionsObject[type].setAttribute('selected', '');
        }
    }
}

export class OperationCreate extends Operation {
    async init() {
        super.init().then();
        const type = (new URLSearchParams(window.location.search)).get('type');
        if (type) {
            this.setInitialType(type);
        }
        if (this.typeSelectElement.value) {
            await this.loadCategoryList(this.typeSelectElement.value);
        }
        if (this.proceedButton) {
            this.proceedButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (ValidationUtils.validateForm(this.validations)) {
                    HttpUtils.request('/operations', 'POST', true, {
                        type: this.typeSelectElement.value,
                        category_id: parseInt(this.categorySelectElement.value),
                        amount: parseInt(this.amountInputElement.value),
                        date: new Date(this.dateInputElement.value).toISOString().slice(0, 10),
                        comment: this.commentaryInputElement.value ? this.commentaryInputElement.value : ' ',
                    });
                    this.openNewRoute(`/balance?period=${this.period}`);
                }
            });
        }
    };

}

export class OperationEdit extends Operation {
    async init() {
        super.init().then();
        const mainTitleElement = document.querySelector('.main-content__title');
        if (mainTitleElement) {
            mainTitleElement.innerText = 'Редактирование дохода/расхода';
        }
        let operationId = null;
        if (this.params) {
            operationId = this.params.get('operationId');
            if (operationId) {
                await this.loadCurrentOperation(operationId);
            } else {
                await this.openNewRoute('/balance');
                return;
            }
        }
        if (this.proceedButton) {
            this.proceedButton.innerText = 'Сохранить';
            this.proceedButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (ValidationUtils.validateForm(this.validations)) {
                    const changedOperation = {
                        type: this.typeSelectElement.value,
                        category_id: parseInt(this.categorySelectElement.value),
                        amount: parseInt(this.amountInputElement.value),
                        date: new Date(this.dateInputElement.value).toISOString().slice(0, 10),
                        comment: this.commentaryInputElement.value ? this.commentaryInputElement.value : ' ',
                    };
                    const hasChanged = Object.keys(changedOperation).map((key) => {
                        return changedOperation[key] !== this.currentOperation[key];
                    }).some(Boolean);
                    if (hasChanged) {
                        HttpUtils.request(`/operations/${operationId}`, 'PUT', true, changedOperation);
                    }
                    this.openNewRoute(`/balance?period=${this.period}`);
                }
            });
        }
        if (this.cancelButton) {
            this.cancelButton.href = `/balance?period=${this.period}`;
        }
        if (this.typeSelectElement) {
            this.typeSelectElement.disabled = true;
        }
    };

    async loadCurrentOperation(id) {
        const result = await HttpUtils.request(`/operations/${id}`, 'GET');
        if (result.response && !result.response.error) {
            this.currentOperation = result.response;
            this.setInitialType(this.currentOperation.type);
            if (this.typeSelectElement.value) {
                await this.loadCategoryList(this.typeSelectElement.value, true);
            }
            this.currentOperation.category_id = this.categoryObject[this.currentOperation.category];
            this.categorySelectElement.value = this.categoryObject[this.currentOperation.category].toString();
            this.amountInputElement.value = this.currentOperation.amount.toString();
            this.dateInputElement.value = new Date(this.currentOperation.date.split('.').reverse().join('-')).toISOString().slice(0, 10);
            this.commentaryInputElement.value = this.currentOperation.comment;
        }
    };
}
