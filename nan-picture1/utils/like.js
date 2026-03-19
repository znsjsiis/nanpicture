const request = require('./request.js');

/**
 * 点赞/取消点赞
 * @param {number} pictureId 图片ID
 * @returns {Promise<boolean>} true: 点赞成功, false: 取消点赞
 */
async function doLike(pictureId) {
    // 使用表单格式发送，适配 @RequestParam
    return await request.post('/picture/like?id=' + pictureId, {});
}

/**
 * 检查是否已点赞
 * @param {number} pictureId 图片ID
 * @returns {Promise<boolean>}
 */
async function checkLike(pictureId) {
    return await request.get('/picture/like/check', {pictureId});
}

/**
 * 批量检查点赞状态
 * @param {Array<number>} pictureIds 图片ID数组
 * @returns {Promise<Object>} 返回 {pictureId: boolean} 的映射
 */
async function checkLikeBatch(pictureIds) {
    const result = {};
    for (const id of pictureIds) {
        try {
            result[id] = await checkLike(id);
        } catch (e) {
            result[id] = false;
        }
    }
    return result;
}

module.exports = {
    doLike,
    checkLike,
    checkLikeBatch
};