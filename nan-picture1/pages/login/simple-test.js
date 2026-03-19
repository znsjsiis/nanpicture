Page({
    data: {
        nativeInput: '',
        vantInput: ''
    },

    onNativeInput(event) {
        console.log('原生输入:', event.detail.value);
        this.setData({
            nativeInput: event.detail.value
        });
    },

    onVantInput(event) {
        console.log('Vant输入:', event.detail.value);
        this.setData({
            vantInput: event.detail.value
        });
    }
});