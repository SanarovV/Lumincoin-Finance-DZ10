import {AuthUtils} from "../../utils/auth-utils";
import {ValidationUtils} from "../../utils/validation-utils";
import {AuthService} from "../../services/auth-service";

export class SignUp {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            this.openNewRoute('/').then();
            return;
        }
        this.findElements();
        this.setValidations();
        const signUpButtonElement = document.getElementById("sign-up");
        if (signUpButtonElement) {
            signUpButtonElement.addEventListener("click", this.signUp.bind(this));
        }
    }

    findElements() {
        this.emailElement = document.getElementById('email');
        this.nameElement = document.getElementById('name');
        this.lastNameElement = document.getElementById('last-name');
        this.passwordElement = document.getElementById('password');
        this.passwordConfirmElement = document.getElementById('password-confirm');
        this.nameErrorElement = document.getElementById('name-error');
        this.lastNameErrorElement = document.getElementById('last-name-error');
        this.commonErrorElement = document.getElementById('common-error');
        this.passwordErrorElement = document.getElementById('password-error');
        this.passwordConfirmErrorElement = document.getElementById('password-confirm-error');
    }

    setValidations() {
        this.validations = [
            {element: this.emailElement, options: {pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/}},
            {
                element: this.nameElement,
                options: {pattern: /^[А-ЯЁ][а-яё]+(?: [А-ЯЁ][а-яё]+)*$/,},
                errorElement: this.nameErrorElement,
                errorPatternText: 'Имя - должно содержать русские буквы, начинается с большой буквы'
            },
            {
                element: this.lastNameElement,
                options: {pattern: /^[А-ЯЁ][а-яё]+(?: [А-ЯЁ][а-яё]+)*$/},
                errorElement: this.lastNameErrorElement,
                errorPatternText: 'Фамилия - должна содержать русские буквы, начинается с большой буквы'
            },
            {
                element: this.passwordElement,
                options: {pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/},
                errorElement: this.passwordErrorElement,
                errorPatternText: 'Пароль должен быть не менее 6 символов и содержать цифру, латинскую букву в верхнем и нижнем регистре'
            },
            {
                element: this.passwordConfirmElement,
                options: {compareTo: this.passwordElement},
                errorElement: this.passwordConfirmErrorElement,
                errorPatternText: 'Пароль и подтверждение не совпадают'
            },
        ];
    }

    async signUp() {
        this.commonErrorElement ? this.commonErrorElement.style.display = 'none' : null;
        for (let i = 0; i < this.validations.length; i++) {
            let validations = this.validations[i];
            if ((validations.element.value === '') && validations.errorPatternText) {
                this.nameErrorElement.innerText = 'Введите имя'
                this.lastNameErrorElement.innerText = 'Введите фамилию'
                this.passwordErrorElement.innerText = 'Введите пароль'
                this.passwordConfirmErrorElement.innerText = 'Повторите пароль'
            }

            if (validations.element === this.passwordConfirmElement) {
                validations.options.compareTo = this.passwordElement.value;
            }
        }
        if (ValidationUtils.validateForm(this.validations)) {
            let signupResult = AuthService.signUp( {
                name: this.nameElement.value,
                lastName: this.lastNameElement.value,
                email: this.emailElement.value,
                password: this.passwordElement.value,
                passwordRepeat: this.passwordConfirmElement.value,
            });

            if (signupResult) {
                // signupResult = signupResult.tokens;
                AuthUtils.setAuthInfo(signupResult.accessToken, signupResult.refreshToken, {
                    user: {
                        id: signupResult.id,
                        email: signupResult.email,
                        name: signupResult.name,
                        lastName: signupResult.lastName,
                    }
                });
                return this.openNewRoute('/');
            }
        }
    };
}