const auth = require('../../utils/auth.js');
const request = require('../../utils/request.js');

Page({
    data: {
        activeTab: 0, // 底部导航选中项
        userInfo: null, // 用户信息
        loading: false, // 加载状态
        showLogoutDialog: false, // 显示退出登录对话框

        // 统计信息
        statistics: {
            uploadCount: 0,
            likeCount: 0,
            followerCount: 0
        }
    },

    onLoad() {
        this.checkLoginStatus();
    },

    onShow() {
        this.loadUserData();
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        if (!auth.isLoggedIn()) {
            // 未登录，跳转到登录页面
            wx.redirectTo({
                url: '/pages/login/login'
            });
        } else {
            // 已登录，加载用户数据
            this.setData({
                userInfo: auth.getUserInfo()
            });
            this.loadUserData();
        }
    },

    /**
     * 加载用户数据
     */
    async loadUserData() {
        if (!auth.isLoggedIn()) return;

        this.setData({loading: true});

        try {
            // 获取最新用户信息
            const userInfo = await auth.getCurrentUser();
            this.setData({userInfo});

            // 加载统计信息（这里可以根据实际API调整）
            this.loadStatistics();

        } catch (error) {
            console.error('加载用户数据失败:', error);
        } finally {
            this.setData({loading: false});
        }
    },

    /**
     * 加载统计信息
     */
    async loadStatistics() {
        try {
            // 这里可以调用获取用户统计数据的API
            // 暂时使用模拟数据
            this.setData({
                statistics: {
                    uploadCount: Math.floor(Math.random() * 100),
                    likeCount: Math.floor(Math.random() * 500),
                    followerCount: Math.floor(Math.random() * 1000)
                }
            });
        } catch (error) {
            console.error('加载统计信息失败:', error);
        }
    },

    /**
     * 编辑个人信息
     */
    onEditProfile() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    /**
     * 查看我的上传
     */
    onViewMyUploads() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    /**
     * 查看收藏
     */
    onViewFavorites() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    /**
     * 设置页面
     */
    onSettings() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    /**
     * 关于我们
     */
    onAbout() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    /**
     * 显示退出登录对话框
     */
    onShowLogoutDialog() {
        this.setData({
            showLogoutDialog: true
        });
    },

    /**
     * 隐藏退出登录对话框
     */
    onHideLogoutDialog() {
        this.setData({
            showLogoutDialog: false
        });
    },

    /**
     * 确认退出登录
     */
    async onConfirmLogout() {
        try {
            wx.showLoading({
                title: '退出中...'
            });

            await auth.logout();

            wx.hideLoading();

            wx.showToast({
                title: '退出成功',
                icon: 'success'
            });

            // 跳转到登录页面
            setTimeout(() => {
                wx.redirectTo({
                    url: '/pages/login/login'
                });
            }, 1500);

        } catch (error) {
            wx.hideLoading();
            console.error('退出登录失败:', error);

            // 即使退出失败，也强制清除本地状态并跳转
            const app = getApp();
            app.clearUser();

            wx.showToast({
                title: '已退出登录',
                icon: 'success'
            });

            setTimeout(() => {
                wx.redirectTo({
                    url: '/pages/login/login'
                });
            }, 1500);
        }
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadUserData().then(() => {
            wx.stopPullDownRefresh();
        });
    }
});