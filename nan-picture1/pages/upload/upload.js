const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');
const config = require('../../config.js');

Page({
    data: {
        activeTab: 2,
        fileList: [],
        uploadQueue: [],
        uploading: false,
        uploadProgress: 0,
        maxFiles: 9,

        pictureInfo: {
            title: '',
            description: '',
            tags: [],
            categoryId: ''
        },

        categories: [],
        tags: [],
        errors: {}
    },

    onLoad() {
        this.loadCategoriesAndTags();
    },

    onGoBack() {
        wx.navigateBack();
    },

    onShow() {
        if (!auth.isLoggedIn()) {
            wx.navigateTo({
                url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/upload/upload')
            });
            return;
        }
    },

    async loadCategoriesAndTags() {
        try {
            const result = await request.get('/picture/tag_category');
            if (result) {
                this.setData({
                    categories: result.categoryList || [],
                    tags: result.tagList || []
                });
            }
        } catch (error) {
            console.error('Load categories failed:', error);
        }
    },

    onInputChange(event) {
        const field = event.currentTarget.dataset.field;
        let value = '';

        if (event.detail && event.detail.value !== undefined) {
            value = event.detail.value;
        } else if (typeof event.detail === 'string') {
            value = event.detail;
        }

        this.setData({
            [`pictureInfo.${field}`]: value,
            [`errors.${field}`]: ''
        });
    },

    onSelectImages() {
        const remainCount = this.data.maxFiles - this.data.fileList.length;

        if (remainCount <= 0) {
            wx.showToast({
                title: `最多选择${this.data.maxFiles}张图片`,
                icon: 'none'
            });
            return;
        }

        wx.chooseMedia({
            count: remainCount,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            maxDuration: 30,
            camera: 'back',
            success: (res) => {
                const newFiles = res.tempFiles.map(file => ({
                    url: file.tempFilePath,
                    size: file.size,
                    name: this.getFileName(file.tempFilePath),
                    status: 'ready',
                    progress: 0
                }));

                this.setData({
                    fileList: [...this.data.fileList, ...newFiles]
                });
            },
            fail: (err) => {
                console.error('Select images failed:', err);
                wx.showToast({
                    title: '选择图片失败',
                    icon: 'none'
                });
            }
        });
    },

    getFileName(path) {
        return path.split('/').pop() || 'image.jpg';
    },

    onPreviewImage(event) {
        const {index} = event.currentTarget.dataset;
        const urls = this.data.fileList.map(file => file.url);

        wx.previewImage({
            urls: urls,
            current: urls[index]
        });
    },

    onRemoveImage(event) {
        const {index} = event.currentTarget.dataset;
        const fileList = [...this.data.fileList];
        fileList.splice(index, 1);

        this.setData({fileList});
    },

    onTagSelect(event) {
        const {tag} = event.currentTarget.dataset;
        const tags = [...this.data.pictureInfo.tags];
        const index = tags.indexOf(tag);

        if (index > -1) {
            tags.splice(index, 1);
        } else {
            tags.push(tag);
        }

        this.setData({
            'pictureInfo.tags': tags,
            'errors.tags': ''
        });
    },

    onCategoryPickerShow() {
        this.setData({showCategoryPicker: true});
    },

    onCategoryPickerClose() {
        this.setData({showCategoryPicker: false});
    },

    onCategoryConfirm(event) {
        const {value} = event.detail;
        this.setData({
            'pictureInfo.categoryId': value,
            showCategoryPicker: false
        });
    },

    validateForm() {
        const {title, tags} = this.data.pictureInfo;
        const errors = {};

        if (!title || title.trim() === '') {
            errors.title = '请输入标题';
        }

        if (tags.length === 0) {
            errors.tags = '请至少选择一个标签';
        }

        if (this.data.fileList.length === 0) {
            errors.files = '请至少选择一张图片';
        }

        this.setData({errors});
        return Object.keys(errors).length === 0;
    },

    async onStartUpload() {
        if (!this.validateForm()) {
            return;
        }

        if (this.data.uploading) {
            return;
        }

        this.setData({uploading: true});

        try {
            for (let i = 0; i < this.data.fileList.length; i++) {
                const file = this.data.fileList[i];
                if (file.status === 'success') continue;

                await this.uploadFile(file, i);
            }

            wx.showToast({
                title: '上传成功',
                icon: 'success'
            });

            setTimeout(() => {
                wx.redirectTo({
                    url: '/pages/gallery/gallery'
                });
            }, 1500);

        } catch (error) {
            console.error('Upload failed:', error);
            wx.showToast({
                title: error.message || 'Upload failed',
                icon: 'none'
            });
        } finally {
            this.setData({uploading: false});
        }
    },

    async uploadFile(file, index) {
        const {title, description, tags, categoryId} = this.data.pictureInfo;
        const app = getApp();
        const cookie = app.globalData.cookie || '';

        return new Promise((resolve, reject) => {
            wx.uploadFile({
                url: config.uploadURL,
                filePath: file.url,
                name: 'file',
                formData: {
                    name: title,
                    introduction: description,
                    tags: JSON.stringify(tags),
                    category: categoryId
                },
                header: {
                    'Cookie': cookie
                },
                success: (res) => {
                    console.log('Upload response:', res);
                    try {
                        const data = JSON.parse(res.data);
                        if (data.code === 0) {
                            const fileList = [...this.data.fileList];
                            fileList[index].status = 'success';
                            this.setData({fileList});
                            resolve(data.data);
                        } else {
                            const fileList = [...this.data.fileList];
                            fileList[index].status = 'fail';
                            this.setData({fileList});
                            reject(new Error(data.message || 'Upload failed'));
                        }
                    } catch (e) {
                        console.error('Parse response failed:', res.data);
                        reject(new Error('Invalid response format'));
                    }
                },
                fail: (err) => {
                    const fileList = [...this.data.fileList];
                    fileList[index].status = 'fail';
                    this.setData({fileList});
                    reject(err);
                }
            });
        });
    },

    onCancelUpload() {
        this.setData({uploading: false});
    }
});