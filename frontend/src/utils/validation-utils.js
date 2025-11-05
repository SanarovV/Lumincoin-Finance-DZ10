export class ValidationUtils {
    static validateForm(validations) {

        let isValid = true;

        for (let i = 0; i < validations.length; i++) {
            if (!ValidationUtils.validateField(validations[i].element, validations[i].options, validations[i].errorElement, validations[i].errorPatternText)) {
                isValid = false;
            }
        }


        return isValid;
    }

    static validateField(element, options, errorElement, errorPatternText) {

        let condition = element.value;

        if (options) {
            if (options.hasOwnProperty('pattern')) {
                condition = element.value && element.value.match(options.pattern);
                if (element.value && errorElement) { errorElement.innerText = errorPatternText }
            } else if (options.hasOwnProperty('compareTo')) {
                condition = element.value && element.value === options.compareTo;
                if (element.value && errorElement) { errorElement.innerText = errorPatternText }
            } else if (options.hasOwnProperty('checkProperty')) {
                condition = options.checkProperty;
            } else if (options.hasOwnProperty('checked')) {
                condition = element.checked;
            }
        }

        if (condition) {
            element.classList.remove('is-invalid');
            return true;
        } else {
            element.classList.add('is-invalid');
            return false;
        }
    }
}