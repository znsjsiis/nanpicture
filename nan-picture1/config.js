// 小程序配置文件
// 真机测试时，请将 localhost 替换为电脑的 IP 地址
// 例如: http://192.168.1.100:8123/api

const config = {
    // 开发环境（模拟器）
    development: {
        baseURL: 'http://localhost:8123/api',
        uploadURL: 'http://localhost:8123/api/picture/upload'
    },

    // 真机测试环境
    // 请将下面的 IP 地址替换为你电脑的实际 IP
    production: {
        baseURL: 'http://192.168.193.161:8123/api',
        uploadURL: 'http://192.168.193.161:8123/api/picture/upload'
    }
};

// 当前环境
const env = 'development'; // 真机测试时改为 'production'

module.exports = {
    baseURL: config[env].baseURL,
    uploadURL: config[env].uploadURL
};