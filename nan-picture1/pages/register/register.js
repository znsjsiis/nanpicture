const auth = require('../../utils/auth.js');
const validator = require('../../utils/validator.js');

Page({
    data: {
        // 表单数据
        formData: {
            userAccount: '',
            userPassword: '',
            checkPassword: ''
        },

        // 表单错误
        errors: {},

        // 页面状态
        loading: false,
        showPassword: false,
        showCheckPassword: false,

        // 重定向地址
        redirect: ''
    },

    onLoad(options) {
        // 获取重定向地址
        if (options.redirect) {
            this.setData({
                redirect: decodeURIComponent(options.redirect)
            });
        }
    },

    /**
     * 输入框变化处理
     */
    onInputChange(event) {
        const {field} = event.currentTarget.dataset;

        // 更安全地获取输入值
        let value = '';
        if (event.detail && event.detail.value !== undefined) {
            value = event.detail.value;
        } else if (typeof event.detail === 'string') {
            value = event.detail;
        }

        this.setData({
            [`formData.${field}`]: value,
            [`errors.${field}`]: ''
        });

        // 如果是确认密码，同时清空密码错误
        if (field === 'checkPassword') {
            this.setData({
                'errors.userPassword': ''
            });
        }
    },

    /**
     * 切换密码显示
     */
    onTogglePassword(event) {
        const {field} = event.currentTarget.dataset;
        this.setData({
            [field === 'userPassword' ? 'showPassword' : 'showCheckPassword']:
                !this.data[field === 'userPassword' ? 'showPassword' : 'showCheckPassword']
        });
    },

    /**
     * 表单验证
     */
    validateForm() {
        const {userAccount, userPassword, checkPassword} = this.data.formData;
        const errors = {};

        // 使用工具类进行验证
        const validationResult = auth.validateUserInput({
            userAccount,
            userPassword,
            checkPassword
        }, 'register');

        if (!validationResult.isValid) {
            validationResult.errors.forEach(error => {
                if (error.includes('用户名')) {
                    errors.userAccount = error;
                } else if (error.includes('密码')) {
                    errors.userPassword = error;
                } else if (error.includes('确认密码')) {
                    errors.checkPassword = error;
                }
            });
        }

        this.setData({errors});
        return Object.keys(errors).length === 0;
    },

    /**
     * 注册提交
     */
    async onSubmit() {
        if (!this.validateForm()) {
            return;
        }

        if (this.data.loading) {
            return;
        }

        this.setData({loading: true});

        try {
            const {userAccount, userPassword, checkPassword} = this.data.formData;

            await auth.register(userAccount, userPassword, checkPassword);

            wx.showToast({
                title: '注册成功',
                icon: 'success'
            });

            // 自动登录
            await auth.login(userAccount, userPassword);

            // 延迟跳转
            setTimeout(() => {
                this.redirectToTarget();
            }, 1500);

        } catch (error) {
            console.error('注册失败:', error);
            wx.showToast({
                title: error.message || '注册失败',
                icon: 'none'
            });
        } finally {
            this.setData({loading: false});
        }
    },

    /**
     * 跳转到目标页面
     */
    redirectToTarget() {
        const redirect = this.data.redirect || '/pages/gallery/gallery';

        if (redirect.startsWith('/pages/')) {
            // tab页面使用switchTab
            if (['/pages/gallery/gallery', '/pages/upload/upload', '/pages/user/user'].includes(redirect)) {
                wx.switchTab({
                    url: redirect
                });
            } else {
                // 普通页面使用redirectTo
                wx.redirectTo({
                    url: redirect
                });
            }
        } else {
            // 默认跳转到图库
            wx.switchTab({
                url: '/pages/gallery/gallery'
            });
        }
    },

    /**
     * 跳转到登录页面
     */
    onGoToLogin() {
        wx.navigateBack();
    }
});