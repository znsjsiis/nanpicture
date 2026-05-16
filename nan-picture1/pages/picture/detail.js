const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');
const likeService = require('../../utils/like.js');

Page({
  data: {
    pictureId: '',
    picture: null,
    loading: true,
    error: '',
    isLiked: false,
    likeCount: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ pictureId: options.id });
      this.loadPictureDetail(options.id);
    } else {
      this.setData({
        loading: false,
        error: '图片ID不存在'
      });
    }
  },

  onShow() {
    // 检查登录状态
    if (!auth.isLoggedIn()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/picture/detail?id=' + this.data.pictureId)
        });
      }, 1500);
    }
  },

  /**
   * 加载图片详情
   */
  async loadPictureDetail(id) {
    this.setData({ loading: true, error: '' });

    try {
      const result = await request.get('/picture/get/vo', { id });

      if (result) {
        this.setData({
          picture: result,
          likeCount: result.likeCount || 0,
          loading: false
        });

        // 检查是否已点赞
        this.checkLikeStatus(id);
      } else {
        this.setData({
          loading: false,
          error: '图片不存在或已被删除'
        });
      }
    } catch (err) {
      console.error('加载图片详情失败:', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败'
      });
    }
  },

  /**
   * 检查点赞状态
   */
  async checkLikeStatus(pictureId) {
    try {
      const isLiked = await likeService.checkLike(pictureId);
      this.setData({ isLiked });
    } catch (err) {
      console.error('检查点赞状态失败:', err);
    }
  },

  /**
   * 预览图片
   */
  onPreviewImage() {
    if (this.data.picture && this.data.picture.url) {
      wx.previewImage({
        urls: [this.data.picture.url],
        current: this.data.picture.url
      });
    }
  },

  /**
   * 点赞/取消点赞
   */
  async onToggleLike() {
    if (!auth.isLoggedIn()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await likeService.doLike(this.data.pictureId);

      // 更新状态
      this.setData({
        isLiked: result,
        likeCount: this.data.likeCount + (result ? 1 : -1)
      });

      wx.showToast({
        title: result ? '点赞成功' : '取消点赞',
        icon: 'none'
      });
    } catch (err) {
      console.error('点赞操作失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 下载图片
   */
  onDownloadImage() {
    if (!this.data.picture || !this.data.picture.url) {
      return;
    }

    wx.showLoading({ title: '保存中...' });

    wx.downloadFile({
      url: this.data.picture.url,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading();
            wx.showToast({
              title: '已保存到相册',
              icon: 'success'
            });
          },
          fail: (err) => {
            wx.hideLoading();
            if (err.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去授权',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 分享图片
   */
  onShareAppMessage() {
    if (this.data.picture) {
      return {
        title: this.data.picture.name || '精彩图片',
        path: '/pages/picture/detail?id=' + this.data.pictureId,
        imageUrl: this.data.picture.url
      };
    }
    return {
      title: '小张云图库',
      path: '/pages/gallery/gallery'
    };
  },

  /**
   * 返回上一页
   */
  onGoBack() {
    wx.navigateBack();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadPictureDetail(this.data.pictureId).then(() => {
      wx.stopPullDownRefresh();
    });
  }
});