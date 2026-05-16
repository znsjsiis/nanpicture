const request = require('../../utils/request.js');
const likeService = require('../../utils/like.js');
const auth = require('../../utils/auth.js');

Page({
    data: {
        pictures: [],
        loading: false,
        hasMore: true,
        currentPage: 1,
        pageSize: 20,
        activeTab: 1,

        columns: 2,
        columnHeight: [0, 0],
        columnItems: [[], []],

        searchKeyword: '',
        selectedTag: '',
        tags: ['全部', '热门', '生活', '高清', '游戏', '影视', '汽车', '运动', '科技']
    },

    onLoad() {
        console.log('gallery page load');
        Promise.all([
            this.loadPictures(),
            this.loadTags()
        ]).then(() => {
            console.log('init data loaded');
        }).catch(error => {
            console.error('init data error:', error);
        });
    },

    onShow() {
        console.log('gallery page show');

        // 检查登录状态
        if (!auth.isLoggedIn()) {
            wx.redirectTo({
                url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/gallery/gallery')
            });
            return;
        }

        this.refreshData();
        this.loadTags();
    },

    async refreshData() {
        console.log('refresh data start');
        this.setData({
            pictures: [],
            columnItems: [[], []],
            columnHeight: [0, 0],
            currentPage: 1,
            hasMore: true
        });

        await Promise.all([
            this.loadPictures(),
            this.loadTags()
        ]);

        console.log('refresh data complete');
    },

    async loadPictures() {
        if (this.data.loading || !this.data.hasMore) return;

        this.setData({loading: true});

        try {
            const params = {
                current: this.data.currentPage,
                pageSize: this.data.pageSize
            };

            if (this.data.searchKeyword) {
                params.searchText = this.data.searchKeyword;
            }

            if (this.data.selectedTag && this.data.selectedTag !== '全部') {
                params.tags = [this.data.selectedTag];
            }

            console.log('request params:', params);

            const result = await request.post('/picture/list/page/vo', params);

            console.log('api result:', result);

            if (result && result.records) {
                const newPictures = result.records;

                if (newPictures.length === 0) {
                    this.setData({hasMore: false});
                    return;
                }

                this.processWaterfallLayout(newPictures);

                this.setData({
                    currentPage: this.data.currentPage + 1,
                    hasMore: newPictures.length >= this.data.pageSize
                });
            }
        } catch (error) {
            console.error('load pictures error:', error);
        } finally {
            this.setData({loading: false});
        }
    },

    processWaterfallLayout(newPictures) {
        console.log('process waterfall, count:', newPictures.length);

        const updatedColumnItems = [...this.data.columnItems];
        const updatedColumnHeight = [...this.data.columnHeight];

        newPictures.forEach((picture, index) => {
            console.log('process picture', index, picture);

            const minHeightIndex = updatedColumnHeight[0] <= updatedColumnHeight[1] ? 0 : 1;

            updatedColumnItems[minHeightIndex].push(picture);
            updatedColumnHeight[minHeightIndex] += this.estimateImageHeight(picture);
        });

        console.log('updated columns:', updatedColumnItems);

        this.setData({
            columnItems: updatedColumnItems,
            columnHeight: updatedColumnHeight
        }, () => {
            console.log('setData callback, data:', this.data.columnItems);
        });
    },

    estimateImageHeight(picture) {
        const baseHeight = 200;
        const titleHeight = picture.name || picture.title ? 30 : 0;
        const tagsHeight = picture.tags && picture.tags.length > 0 ? 40 : 0;
        return baseHeight + titleHeight + tagsHeight + 20;
    },

    async loadTags() {
        try {
            console.log('load tags start');
            const result = await request.get('/picture/tag_category');
            console.log('tags api result:', result);

            if (result && result.tagList) {
                const tags = ['全部', ...result.tagList];
                console.log('processed tags:', tags);
                this.setData({tags});
            }
        } catch (error) {
            console.error('load tags error:', error);
        }
    },

    onTagSelect(event) {
        const tag = event.currentTarget.dataset.tag;
        this.setData({
            selectedTag: tag,
            currentPage: 1,
            hasMore: true
        });
        this.refreshData();
    },

    onSearch() {
        this.setData({
            currentPage: 1,
            hasMore: true
        });
        this.refreshData();
    },

    onSearchInput(event) {
        this.setData({
            searchKeyword: event.detail
        });
    },

    onViewPicture(event) {
        const {index, columnIndex} = event.currentTarget.dataset;

        if (!this.data.columnItems[columnIndex] || !this.data.columnItems[columnIndex][index]) {
            console.error('Picture not found:', columnIndex, index);
            return;
        }

        const picture = this.data.columnItems[columnIndex][index];

        wx.navigateTo({
            url: `/pages/picture/detail?id=${picture.id}`
        });
    },

    onPreviewImage(event) {
        const {index, columnIndex} = event.currentTarget.dataset;

        if (!this.data.columnItems[columnIndex] || !this.data.columnItems[columnIndex][index]) {
            console.error('Picture not found for preview:', columnIndex, index);
            return;
        }

        const picture = this.data.columnItems[columnIndex][index];

        wx.previewImage({
            urls: [picture.url],
            current: picture.url
        });
    },

    onLoadMore() {
        if (this.data.hasMore && !this.data.loading) {
            this.loadPictures();
        }
    },

    /**
     * 点赞/取消点赞
     */
    async onLikePicture(event) {
        const {id, index, columnIndex} = event.currentTarget.dataset;

        if (!id) {
            console.error('Picture id not found');
            return;
        }

        try {
            // 调用点赞接口
            const result = await likeService.doLike(id);

            // 更新本地数据
            const columnItems = [...this.data.columnItems];
            const picture = columnItems[columnIndex][index];

            if (picture) {
                // 更新点赞状态和数量
                picture.isLiked = result;
                picture.likeCount = (picture.likeCount || 0) + (result ? 1 : -1);

                this.setData({columnItems});

                wx.showToast({
                    title: result ? '点赞成功' : '取消点赞',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('Like failed:', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        }
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        console.log('pull down refresh');
        this.refreshData().then(() => {
            wx.stopPullDownRefresh();
        }).catch(() => {
            wx.stopPullDownRefresh();
        });
    }
});