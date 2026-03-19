Component({
    properties: {
        // 当前选中的tab索引
        active: {
            type: Number,
            value: 0
        }
    },

    data: {
        tabs: [
            {
                id: 0,
                name: '我的',
                icon: 'manager-o',
                activeIcon: 'manager',
                page: '/pages/user/user'
            },
            {
                id: 1,
                name: '图库',
                icon: 'photo-o',
                activeIcon: 'photo',
                page: '/pages/gallery/gallery'
            },
            {
                id: 2,
                name: '上传',
                icon: 'plus',
                activeIcon: 'plus',
                page: '/pages/upload/upload'
            }
        ]
    },

    methods: {
        /**
         * tab点击事件
         */
        onTabClick(event) {
            const {index, page} = event.currentTarget.dataset;
            const tabIndex = parseInt(index);

            // 如果点击的是当前页面，不处理
            if (tabIndex === this.data.active) {
                return;
            }

            // 触发自定义事件，通知父组�?
            this.triggerEvent('change', {
                index: parseInt(index),
                page: page
            });

            // 页面跳转
            wx.redirectTo({
                url: page
            });
        },

        /**
         * 外部调用方法：更新选中状�?
         */
        setActive(active) {
            this.setData({
                active: active
            });
        }
    }
});
