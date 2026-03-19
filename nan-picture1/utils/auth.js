/**
 * 用户认证工具类
 * 处理用户登录、注册、状态管理等
 */

const request = require('./request.js');

/**
 * 用户登录
 * @param {string} userAccount 用户账号
 * @param {string} userPassword 用户密码
 * @returns {Promise} 登录结果
 */
async function login(userAccount, userPassword) {
    try {
        const result = await request.post('/user/login', {
            userAccount,
            userPassword
        });

        // 保存用户信息
        const app = getApp();
        app.setUser(result);

        return result;
    } catch (error) {
        console.error('登录失败:', error);
        throw error;
    }
}

/**
 * 用户注册
 * @param {string} userAccount 用户账号
 * @param {string} userPassword 用户密码
 * @param {string} checkPassword 确认密码
 * @returns {Promise} 注册结果
 */
async function register(userAccount, userPassword, checkPassword) {
    try {
        const result = await request.post('/user/register', {
            userAccount,
            userPassword,
            checkPassword
        });
        return result;
    } catch (error) {
        console.error('注册失败:', error);
        throw error;
    }
}

/**
 * 获取当前登录用户信息
 * @returns {Promise} 用户信息
 */
async function getCurrentUser() {
    try {
        const result = await request.get('/user/get/login');
        const app = getApp();
        app.setUser(result);
        return result;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        throw error;
    }
}

/**
 * 更新用户信息
 * @param {Object} userData 用户数据
 * @returns {Promise} 更新结果
 */
async function updateUserInfo(userData) {
    try {
        const result = await request.post('/user/update', userData);

        // 更新本地用户信息
        const app = getApp();
        const currentUser = app.getCurrentUser();
        if (currentUser) {
            Object.assign(currentUser, userData);
            app.setUser(currentUser);
        }

        return result;
    } catch (error) {
        console.error('更新用户信息失败:', error);
        throw error;
    }
}

/**
 * 用户退出登录
 * @returns {Promise} 退出结果
 */
async function logout() {
    try {
        const result = await request.post('/user/logout');

        // 清除本地用户状态
        const app = getApp();
        app.clearUser();

        return result;
    } catch (error) {
        console.error('退出登录失败:', error);

        // 即使服务端退出失败，也要清除本地状态
        const app = getApp();
        app.clearUser();

        throw error;
    }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    const app = getApp();
    return app.isLoggedIn();
}

/**
 * 获取用户信息（本地缓存）
 * @returns {Object|null} 用户信息
 */
function getUserInfo() {
    const app = getApp();
    return app.getCurrentUser();
}

/**
 * 验证用户输入
 * @param {Object} data 验证数据
 * @param {string} type 验证类型 ('login'|'register')
 * @returns {Object} 验证结果
 */
function validateUserInput(data, type = 'login') {
    const errors = [];

    // 验证用户名
    if (!data.userAccount || data.userAccount.trim() === '') {
        errors.push('请输入用户名');
    } else if (data.userAccount.length < 4) {
        errors.push('用户名至少4个字符');
    } else if (data.userAccount.length > 20) {
        errors.push('用户名不能超过20个字符');
    }

    // 验证密码
    if (!data.userPassword || data.userPassword.trim() === '') {
        errors.push('请输入密码');
    } else if (data.userPassword.length < 6) {
        errors.push('密码至少6个字符');
    } else if (data.userPassword.length > 20) {
        errors.push('密码不能超过20个字符');
    }

    // 注册时验证确认密码
    if (type === 'register') {
        if (!data.checkPassword || data.checkPassword.trim() === '') {
            errors.push('请输入确认密码');
        } else if (data.userPassword !== data.checkPassword) {
            errors.push('两次输入的密码不一致');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

module.exports = {
    login,
    register,
    getCurrentUser,
    updateUserInfo,
    logout,
    isLoggedIn,
    getUserInfo,
    validateUserInput
};