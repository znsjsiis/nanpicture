const config = require('./config.js');

App({
    globalData: {
        baseURL: config.baseURL,
        uploadURL: config.uploadURL,
        user: null,
        cookie: "",
        // Vant Weapp 配置
        vanTheme: 'light'
    },

    onLaunch() {
        console.log('小张云图库启动');
        // 初始化用户状态
        this.initUserState();
    },

    initUserState() {
        try {
            const cookie = wx.getStorageSync("cookie") || "";
            const user = wx.getStorageSync("user") || null;
            this.globalData.cookie = cookie;
            this.globalData.user = user;
            console.log('用户状态初始化完成:', user);
        } catch (error) {
            console.error('初始化用户状态失败:', error);
        }
    },

    // 确保用户已登录
    ensureLogin(next) {
        if (this.globalData && this.globalData.user) {
            next && next();
            return;
        }

        // 记录当前页面作为重定向目标
        let redirect = "/pages/gallery/gallery";
        const pages = getCurrentPages();
        if (pages && pages.length) {
            const current = pages[pages.length - 1];
            const query = current.options
                ? Object.entries(current.options).map(([k, v]) => `${k}=${v}`).join("&")
                : "";
            redirect = `/${current.route}${query ? "?" + query : ""}`;
        }

        wx.navigateTo({
            url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}`
        });
    },

    // 设置会话cookie
    setSessionCookie(cookie) {
        this.globalData.cookie = cookie;
        wx.setStorageSync("cookie", cookie);
    },

    // 设置用户信息
    setUser(user) {
        this.globalData.user = user;
        wx.setStorageSync("user", user);
    },

    // 清除用户状态
    clearUser() {
        this.globalData.user = null;
        this.globalData.cookie = "";
        wx.removeStorageSync("user");
        wx.removeStorageSync("cookie");
    },

    // 获取当前用户
    getCurrentUser() {
        return this.globalData.user;
    },

    // 检查是否已登录
    isLoggedIn() {
        return !!this.globalData.user;
    }
})