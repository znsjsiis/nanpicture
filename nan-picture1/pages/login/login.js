const auth = require('../../utils/auth.js');
const validator = require('../../utils/validator.js');

Page({
    data: {
        formData: {
            userAccount: '',
            userPassword: ''
        },
        errors: {},
        loading: false,
        showPassword: false,
        redirect: ''
    },

    onLoad(options) {
        if (options.redirect) {
            this.setData({
                redirect: decodeURIComponent(options.redirect)
            });
        }

        if (auth.isLoggedIn()) {
            this.redirectToTarget();
        }
    },

    onInputChange(event) {
        const {field} = event.currentTarget.dataset;
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
    },

    onFieldFocus(event) {
        const {field} = event.currentTarget.dataset;
        this.setData({
            [`errors.${field}`]: ''
        });
    },

    onTogglePassword() {
        this.setData({
            showPassword: !this.data.showPassword
        });
    },

    validateForm() {
        const {userAccount, userPassword} = this.data.formData;
        const errors = {};

        if (!userAccount) {
            errors.userAccount = 'Please enter username';
        }

        if (!userPassword) {
            errors.userPassword = 'Please enter password';
        }

        this.setData({errors});
        return Object.keys(errors).length === 0;
    },

    async onSubmit() {
        if (!this.validateForm()) {
            return;
        }

        if (this.data.loading) {
            return;
        }

        this.setData({loading: true});

        try {
            const {userAccount, userPassword} = this.data.formData;
            await auth.login(userAccount, userPassword);

            wx.showToast({
                title: 'Login success',
                icon: 'success'
            });

            setTimeout(() => {
                this.redirectToTarget();
            }, 1500);

        } catch (error) {
            console.error('Login failed:', error);
            wx.showToast({
                title: error.message || 'Login failed',
                icon: 'none'
            });
        } finally {
            this.setData({loading: false});
        }
    },

    redirectToTarget() {
        const redirect = this.data.redirect || '/pages/gallery/gallery';

        // Use redirectTo instead of switchTab
        wx.redirectTo({
            url: redirect,
            fail: (err) => {
                console.error('Redirect failed:', err);
                // Try navigateTo as fallback
                wx.navigateTo({
                    url: redirect
                });
            }
        });
    },

    onGoToRegister() {
        wx.navigateTo({
            url: '/pages/register/register?redirect=' + encodeURIComponent(this.data.redirect)
        });
    },

    onForgotPassword() {
        wx.showToast({
            title: 'Feature coming soon',
            icon: 'none'
        });
    }
});
