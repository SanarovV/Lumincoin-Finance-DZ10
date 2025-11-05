import {AuthUtils} from "../../utils/auth-utils";
import {ValidationUtils} from "../../utils/validation-utils";
import {HttpUtils} from "../../utils/http-utils";


export class Login {
    constructor(openNewRoute) {

        this.openNewRoute = openNewRoute;
        this.findElements();
        this.setValidations();
        const loginButtonElement = document.getElementById("login");
        if (loginButtonElement) {
            loginButtonElement.addEventListener("click", this.login.bind(this));
        }
    }

    findElements() {
        this.emailElement = document.getElementById('email');
        this.passwordElement = document.getElementById('password');
        this.rememberMeElement = document.getElementById('remember');
        this.commonErrorElement = document.getElementById('common-error');
        this.passwordErrorElement = document.getElementById('password-error');
    }

    setValidations() {
        this.validations = [
            {
                element: this.passwordElement,
                options: {pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/},
                errorElement: this.passwordErrorElement,
                errorPatternText: 'Пароль должен быть не менее 6 символов и содержать цифру, латинскую букву в верхнем и нижнем регистре'
            },
            {element: this.emailElement, options: {pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/}},
        ];
    }

    async login() {
        if (this.commonErrorElement) {
            this.commonErrorElement.style.display = 'none';
        }
        for (let i = 0; i < this.validations.length; i++) {
            let validations = this.validations[i];
            if ((validations.element.value === '') && validations.errorPatternText) {
                this.passwordErrorElement.innerText = 'Введите пароль'
            }
        }
        if (ValidationUtils.validateForm(this.validations)) {
            const result = await HttpUtils.request('/login', 'POST', false,{
                email: this.emailElement.value,
                password: this.passwordElement.value,
                rememberMe: this.rememberMeElement.checked
            });

            if (result.error || !result.response || (result.response && (!result.response.user || !result.response.tokens))) {
                this.commonErrorElement.style.display = 'block';
                return;
            }

            AuthUtils.setAuthInfo(result.response.tokens.accessToken, result.response.tokens.refreshToken, result.response.user);

            this.openNewRoute('/');
        }
    };
}