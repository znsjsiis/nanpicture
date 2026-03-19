/**
 * 网络请求工具类
 * 封装微信小程序的request和uploadFile方法
 */

const app = getApp();

// 默认配置
const DEFAULT_CONFIG = {
    timeout: 10000,
    showLoading: true,
    loadingText: '加载中...'
};

// 状态码映射
const STATUS_CODE_MAP = {
    200: '请求成功',
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '请求资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
};

/**
 * 显示错误提示
 */
function showError(message) {
    wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    });
}

/**
 * 显示加载提示
 */
function showLoading(text = DEFAULT_CONFIG.loadingText) {
    wx.showLoading({
        title: text,
        mask: true
    });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    wx.hideLoading();
}

/**
 * 获取请求头中的Cookie
 */
function getRequestCookie() {
    return app.globalData.cookie || wx.getStorageSync('cookie') || '';
}

/**
 * 从响应头中提取并存储Cookie
 */
function storeCookieFromHeader(headers) {
    const setCookie = headers['Set-Cookie'] || headers['set-cookie'];
    if (setCookie) {
        const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        app.setSessionCookie(cookie);
    }
}

/**
 * 统一的HTTP请求方法
 */
function request(options) {
    const config = Object.assign({}, DEFAULT_CONFIG, options);

    return new Promise((resolve, reject) => {
        // 显示加载提示
        if (config.showLoading) {
            showLoading(config.loadingText);
        }

        // 构造请求头
        const cookie = getRequestCookie();
        const header = Object.assign({
            'Content-Type': 'application/json',
            'Cookie': cookie
        }, config.header || {});

        // 发起请求
        wx.request({
            url: app.globalData.baseURL + config.url,
            method: config.method || 'GET',
            data: config.data || {},
            header: header,
            timeout: config.timeout,

            success(res) {
                // 存储Cookie
                storeCookieFromHeader(res.header || {});

                // 处理响应
                if (res.statusCode === 200) {
                    const data = res.data;
                    if (data.code === 0) {
                        // 业务请求成功
                        resolve(data.data);
                    } else {
                        // 业务请求失败
                        const errorMsg = data.message || STATUS_CODE_MAP[res.statusCode] || '请求失败';

                        // 处理未登录错误
                        if (data.code === 40100 || errorMsg.includes('未登录') || errorMsg.includes('未授权')) {
                            app.clearUser();
                            wx.redirectTo({
                                url: '/pages/login/login'
                            });
                        }

                        showError(errorMsg);
                        reject(new Error(errorMsg));
                    }
                } else {
                    // HTTP状态码错误
                    const errorMsg = STATUS_CODE_MAP[res.statusCode] || `请求失败 (${res.statusCode})`;
                    showError(errorMsg);

                    // 特殊处理401未授权
                    if (res.statusCode === 401) {
                        app.clearUser();
                        wx.redirectTo({
                            url: '/pages/login/login'
                        });
                    }

                    reject(new Error(errorMsg));
                }
            },

            fail(err) {
                console.error('网络请求失败:', err);
                const errorMsg = err.errMsg || '网络连接失败';
                showError(errorMsg);
                reject(err);
            },

            complete() {
                // 隐藏加载提示
                if (config.showLoading) {
                    hideLoading();
                }
            }
        });
    });
}

/**
 * 文件上传方法
 */
function uploadFile(options) {
    const config = Object.assign({}, DEFAULT_CONFIG, options);

    return new Promise((resolve, reject) => {
        const cookie = getRequestCookie();

        const uploadTask = wx.uploadFile({
            url: app.globalData.baseURL + config.url,
            filePath: config.filePath,
            name: config.name || 'file',
            formData: config.formData || {},
            header: Object.assign({
                'Cookie': cookie
            }, config.header || {}),

            success(res) {
                try {
                    const data = JSON.parse(res.data);
                    if (data.code === 0) {
                        resolve(data.data);
                    } else {
                        const errorMsg = data.message || '上传失败';
                        showError(errorMsg);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('解析上传响应失败:', e);
                    showError('上传响应格式错误');
                    reject(e);
                }
            },

            fail(err) {
                console.error('文件上传失败:', err);
                const errorMsg = err.errMsg || '上传失败';
                showError(errorMsg);
                reject(err);
            }
        });

        // 监听上传进度
        if (config.onProgress && typeof config.onProgress === 'function') {
            uploadTask.onProgressUpdate((progress) => {
                config.onProgress(progress);
            });
        }

        return uploadTask;
    });
}

/**
 * GET请求
 */
function get(url, data = {}, options = {}) {
    return request(Object.assign({url, method: 'GET', data}, options));
}

/**
 * POST请求
 */
function post(url, data = {}, options = {}) {
    return request(Object.assign({url, method: 'POST', data}, options));
}

/**
 * PUT请求
 */
function put(url, data = {}, options = {}) {
    return request(Object.assign({url, method: 'PUT', data}, options));
}

/**
 * DELETE请求
 */
function del(url, data = {}, options = {}) {
    return request(Object.assign({url, method: 'DELETE', data}, options));
}

module.exports = {
    request,
    uploadFile,
    get,
    post,
    put,
    delete: del
};