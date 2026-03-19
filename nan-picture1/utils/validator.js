/**
 * 表单验证工具类
 * 提供常用的表单验证方法
 */

/**
 * 验证手机号码
 * @param {string} phone 手机号码
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * 验证邮箱地址
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 验证用户名
 * @param {string} username 用户名
 * @returns {boolean} 是否有效
 */
function validateUsername(username) {
    // 用户名长度4-20位，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    return usernameRegex.test(username);
}

/**
 * 验证密码强度
 * @param {string} password 密码
 * @returns {Object} 验证结果
 */
function validatePassword(password) {
    const result = {
        isValid: true,
        strength: 0,
        messages: []
    };

    if (!password) {
        result.isValid = false;
        result.messages.push('密码不能为空');
        return result;
    }

    // 长度检查
    if (password.length < 6) {
        result.isValid = false;
        result.messages.push('密码至少6个字符');
    }
    if (password.length > 20) {
        result.isValid = false;
        result.messages.push('密码不能超过20个字符');
    }

    // 强度检测
    let strength = 0;
    if (/[a-z]/.test(password)) strength++; // 小写字母
    if (/[A-Z]/.test(password)) strength++; // 大写字母
    if (/[0-9]/.test(password)) strength++; // 数字
    if (/[^a-zA-Z0-9]/.test(password)) strength++; // 特殊字符

    result.strength = strength;

    if (strength < 2) {
        result.messages.push('密码强度较弱，建议包含大小写字母、数字和特殊字符');
    }

    return result;
}

/**
 * 验证必填字段
 * @param {*} value 字段值
 * @param {string} fieldName 字段名称
 * @returns {string|null} 错误信息，null表示验证通过
 */
function validateRequired(value, fieldName = '该字段') {
    if (value === null || value === undefined || value === '') {
        return `${fieldName}不能为空`;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return `${fieldName}不能为空`;
    }
    return null;
}

/**
 * 验证最小长度
 * @param {string} value 值
 * @param {number} minLength 最小长度
 * @param {string} fieldName 字段名称
 * @returns {string|null} 错误信息
 */
function validateMinLength(value, minLength, fieldName = '该字段') {
    if (value && value.length < minLength) {
        return `${fieldName}至少${minLength}个字符`;
    }
    return null;
}

/**
 * 验证最大长度
 * @param {string} value 值
 * @param {number} maxLength 最大长度
 * @param {string} fieldName 字段名称
 * @returns {string|null} 错误信息
 */
function validateMaxLength(value, maxLength, fieldName = '该字段') {
    if (value && value.length > maxLength) {
        return `${fieldName}不能超过${maxLength}个字符`;
    }
    return null;
}

/**
 * 验证URL格式
 * @param {string} url URL地址
 * @returns {boolean} 是否有效
 */
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 验证身份证号码
 * @param {string} idCard 身份证号码
 * @returns {boolean} 是否有效
 */
function validateIdCard(idCard) {
    // 18位身份证号码验证
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
}

/**
 * 验证银行卡号
 * @param {string} bankCard 银行卡号
 * @returns {boolean} 是否有效
 */
function validateBankCard(bankCard) {
    // 简单的银行卡号验证（16-19位数字）
    const bankCardRegex = /^\d{16,19}$/;
    return bankCardRegex.test(bankCard);
}

/**
 * 综合表单验证器
 * @param {Object} formData 表单数据
 * @param {Object} rules 验证规则
 * @returns {Object} 验证结果
 */
function validateForm(formData, rules) {
    const errors = {};
    let isValid = true;

    for (const field in rules) {
        const fieldRules = rules[field];
        const fieldValue = formData[field];
        const fieldName = fieldRules.name || field;

        // 必填验证
        if (fieldRules.required) {
            const requiredError = validateRequired(fieldValue, fieldName);
            if (requiredError) {
                errors[field] = requiredError;
                isValid = false;
                continue;
            }
        }

        // 如果字段为空且非必填，跳过其他验证
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
            continue;
        }

        // 长度验证
        if (fieldRules.minLength) {
            const minLengthError = validateMinLength(fieldValue, fieldRules.minLength, fieldName);
            if (minLengthError) {
                errors[field] = minLengthError;
                isValid = false;
            }
        }

        if (fieldRules.maxLength) {
            const maxLengthError = validateMaxLength(fieldValue, fieldRules.maxLength, fieldName);
            if (maxLengthError) {
                errors[field] = maxLengthError;
                isValid = false;
            }
        }

        // 类型特定验证
        if (fieldRules.type) {
            let typeError = null;
            switch (fieldRules.type) {
                case 'phone':
                    if (!validatePhone(fieldValue)) {
                        typeError = `${fieldName}格式不正确`;
                    }
                    break;
                case 'email':
                    if (!validateEmail(fieldValue)) {
                        typeError = `${fieldName}格式不正确`;
                    }
                    break;
                case 'username':
                    if (!validateUsername(fieldValue)) {
                        typeError = `${fieldName}只能包含字母、数字、下划线，长度4-20位`;
                    }
                    break;
                case 'password':
                    const passwordResult = validatePassword(fieldValue);
                    if (!passwordResult.isValid) {
                        typeError = passwordResult.messages[0];
                    }
                    break;
                case 'url':
                    if (!validateUrl(fieldValue)) {
                        typeError = `${fieldName}格式不正确`;
                    }
                    break;
                case 'idCard':
                    if (!validateIdCard(fieldValue)) {
                        typeError = `${fieldName}格式不正确`;
                    }
                    break;
                case 'bankCard':
                    if (!validateBankCard(fieldValue)) {
                        typeError = `${fieldName}格式不正确`;
                    }
                    break;
            }

            if (typeError) {
                errors[field] = typeError;
                isValid = false;
            }
        }
    }

    return {
        isValid,
        errors
    };
}

module.exports = {
    validatePhone,
    validateEmail,
    validateUsername,
    validatePassword,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateUrl,
    validateIdCard,
    validateBankCard,
    validateForm
};