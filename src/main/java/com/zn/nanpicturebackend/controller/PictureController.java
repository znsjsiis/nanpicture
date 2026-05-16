package com.zn.nanpicturebackend.controller;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.zn.nanpicturebackend.annotation.AuthCheck;
import com.zn.nanpicturebackend.common.BaseResponse;
import com.zn.nanpicturebackend.common.DeleteRequest;
import com.zn.nanpicturebackend.common.ResultUtils;
import com.zn.nanpicturebackend.constant.UserConstant;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.exception.ThrowUtils;
import com.zn.nanpicturebackend.model.dto.picture.*;
import com.zn.nanpicturebackend.model.entity.Picture;
import com.zn.nanpicturebackend.model.entity.Space;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.model.enums.PictureReviewStatusEnum;
import com.zn.nanpicturebackend.model.vo.PictureTagCategory;
import com.zn.nanpicturebackend.model.vo.PictureVO;
import com.zn.nanpicturebackend.service.PictureLikeService;
import com.zn.nanpicturebackend.service.PictureService;
import com.zn.nanpicturebackend.service.SpaceService;
import com.zn.nanpicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/picture")
@Slf4j
public class PictureController {

    @Resource
    private PictureService pictureService;
    @Resource
    private UserService userService;
    @Resource
    private PictureLikeService pictureLikeService;
    @Resource
    private StringRedisTemplate stringRedisTemplate;
    @Resource
    private SpaceService spaceService;


    private final Cache<String, String> LOCAL_CACHE =
            Caffeine.newBuilder().initialCapacity(1024)
                    .maximumSize(10000L)//最大10000条
                    //缓存5分钟后移除
                    .expireAfterWrite(5L, TimeUnit.MINUTES)
                    .build();


    /**
     * 上传图片
     *
     * @param multipartFile
     * @param pictureUploadRequest
     * @param request
     * @return
     */
    @PostMapping("/upload")
//    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<PictureVO> uploadPicture(
            @RequestPart("file") MultipartFile multipartFile,
            PictureUploadRequest pictureUploadRequest,
            HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        PictureVO pictureVO = pictureService.uploadPicture(multipartFile, pictureUploadRequest, loginUser);
        return ResultUtils.success(pictureVO);
    }

    /**
     * 通过url上传图片
     */
    @PostMapping("/upload/url")
//    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<PictureVO> uploadPictureByUrl(
            @RequestBody PictureUploadRequest pictureUploadRequest,
            HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        String fileUrl = pictureUploadRequest.getFileUrl();
        PictureVO pictureVO = pictureService.uploadPicture(fileUrl, pictureUploadRequest, loginUser);
        return ResultUtils.success(pictureVO);
    }

    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deletePicture(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        pictureService.deletePicture(deleteRequest.getId(), loginUser);
        return ResultUtils.success(true);
    }


    /**
     * 【管理员接口】更新图片信息
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE) // 假设@AuthCheck是自定义权限注解
    public BaseResponse<Boolean> updatePicture(@RequestBody PictureUpdateRequest pictureUpdateRequest,
                                               HttpServletRequest request) {
        // 1. 参数校验：请求体或ID为空则抛参数错误
        if (pictureUpdateRequest == null || pictureUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        // 2. 复制请求参数到Picture实体
        Picture picture = new Picture();
        BeanUtils.copyProperties(pictureUpdateRequest, picture); // 需确保BeanUtils导入（如org.springframework.beans.BeanUtils）

        // 3. 处理标签：将标签列表转为JSON字符串存储
        picture.setTags(JSONUtil.toJsonStr(pictureUpdateRequest.getTags())); // 假设JSONUtil是自定义工具类

        // 4. 校验Picture实体合法性（由Service实现具体规则）
        pictureService.validPicture(picture);

        // 5. 校验原图片是否存在
        Long id = pictureUpdateRequest.getId();
        Picture oldPicture = pictureService.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR); // 假设ThrowUtils是自定义工具类
        //补充审核参数
        User loginUser = userService.getLoginUser(request);
        pictureService.fileReviewParams(picture, loginUser);
        // 6. 执行更新操作
        boolean result = pictureService.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR); // 注意：原代码是throwIf(result, ...)，逻辑错误，应是!result

        // 7. 返回成功结果
        return ResultUtils.success(true);
    }


    /**
     * 【管理员接口】根据ID获取图片实体
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Picture> getPictureById(Long id, HttpServletRequest request) {
        // 参数校验：ID<=0则抛错
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);

        // 查询图片
        Picture picture = pictureService.getById(id);
        ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR);

        // 返回结果
        return ResultUtils.success(picture);
    }


    /**
     * 根据ID获取图片VO（视图对象）
     */
    @GetMapping("/get/vo")
    public BaseResponse<PictureVO> getPictureVOById(Long id, HttpServletRequest request) {
        // 参数校验
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        // 查询图片实体
        Picture picture = pictureService.getById(id);
        ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR);
        //空间权限校验
        Long spaceId = picture.getSpaceId();
        if (spaceId != null) {
            User loginUser = userService.getLoginUser(request);
            pictureService.checkPictureAuth(loginUser, picture);
        }
        // 转换为VO并返回（由Service实现实体转VO）
        return ResultUtils.success(pictureService.getPictureVO(picture, request));
    }


    /**
     * 【管理员接口】分页查询图片列表
     */
    @PostMapping("/list/page")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<Picture>> listPictureByPage(@RequestBody PictureQueryRequest pictureQueryRequest) {
        // 获取分页参数
        long current = pictureQueryRequest.getCurrent();
        long size = pictureQueryRequest.getPageSize();

        // 构建分页对象+查询条件，执行分页查询
        Page<Picture> picturePage = pictureService.page(
                new Page<>(current, size),
                pictureService.getQueryWrapper(pictureQueryRequest) // 由Service实现查询条件构造
        );

        // 返回分页结果
        return ResultUtils.success(picturePage);
    }

    /**
     * 分页查询图片VO列表
     */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<PictureVO>> listPictureVOPage(
            @RequestBody PictureQueryRequest pictureQueryRequest,
            HttpServletRequest request) {
        // 1. 获取分页参数
        long current = pictureQueryRequest.getCurrent();
        long size = pictureQueryRequest.getPageSize();

        // 2. 限制每页最大条数（避免请求过大）
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        //空间权限校验
        Long spaceId = pictureQueryRequest.getSpaceId();
        if (spaceId == null) {
            //公开图库
            //普通用户只能看到已过审的图片
            pictureQueryRequest.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
            pictureQueryRequest.setNullSpaceId(true);
        } else {

            User loginUser = userService.getLoginUser(request);
            Space space = spaceService.getById(spaceId);
            ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
            if (!loginUser.getId().equals(space.getUserId())) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR, "没有空间权限");
            }
        }
        // 3. 执行图片分页查询
        Page<Picture> picturePage = pictureService.page(
                new Page<>(current, size),
                pictureService.getQueryWrapper(pictureQueryRequest)
        );

        // 4. 转换为PictureVO分页并返回
        return ResultUtils.success(pictureService.getPictureVOPage(picturePage, request));
    }

    //@Deprecated
    @PostMapping("/list/page/vo/cache")
    public BaseResponse<Page<PictureVO>> listPictureVOByPageWithCache(@RequestBody PictureQueryRequest pictureQueryRequest,
                                                                      HttpServletRequest request) {
        long current = pictureQueryRequest.getCurrent();
        long size = pictureQueryRequest.getPageSize();
        //限制爬虫
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        //普通用户默认只能看到审核通过的数据
        pictureQueryRequest.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
        //查询缓存，缓存中没有，再查询数据库
        //构建缓存的key
        String queryCondition = JSONUtil.toJsonStr(pictureQueryRequest);
        String hashKey = DigestUtils.md5DigestAsHex(queryCondition.getBytes());
        String cacheKey = "nanpicture:listPictureVOByPage:" + hashKey;
        //先从本地缓存中获取缓存数据
        String cachedValue = LOCAL_CACHE.getIfPresent(cacheKey);
        if (cachedValue != null) {
            //如果缓存命中，返回结果
            Page<PictureVO> cachedPage = JSONUtil.toBean(cachedValue, Page.class);
            return ResultUtils.success(cachedPage);
        }
        // 本地缓存未命中，从Redis中获取缓存数据
        ValueOperations<String, String> valueOps = stringRedisTemplate.opsForValue();
        cachedValue = valueOps.get(cacheKey);
        if (cachedValue != null) {
            //如果缓存命中，更新本地缓存并返回结果
            LOCAL_CACHE.put(cacheKey, cachedValue);
            Page<PictureVO> cachedPage = JSONUtil.toBean(cachedValue, Page.class);
            return ResultUtils.success(cachedPage);
        }
        //查询数据库
        Page<Picture> picturePage = pictureService.page(new Page<>(current, size),
                pictureService.getQueryWrapper(pictureQueryRequest));
        Page<PictureVO> pictureVOPage = pictureService.getPictureVOPage(picturePage, request);
        //更新Redis缓存
        String cacheValue = JSONUtil.toJsonStr(pictureVOPage);
        //设置缓存的过期时间，5-10分钟过期，随机避免缓存雪崩
        int cacheExpireTime = 300 + RandomUtil.randomInt(0, 300);
        valueOps.set(cacheKey, cacheValue, cacheExpireTime, TimeUnit.SECONDS);
        //写入本地缓存
        LOCAL_CACHE.put(cacheKey, cacheValue);
        //获取封装类
        return ResultUtils.success(pictureVOPage);
    }


    /**
     * 【编辑图片信息】
     * 注：仅图片所属用户可编辑
     */
    @PostMapping("/edit")
    public BaseResponse<Boolean> editPicture(
            @RequestBody PictureEditRequest pictureEditRequest,
            HttpServletRequest request) {
        // 1. 参数校验
        if (pictureEditRequest == null || pictureEditRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 4. 获取当前登录用户，校验权限
        User loginUser = userService.getLoginUser(request);
        pictureService.editPicture(pictureEditRequest, loginUser);
        return ResultUtils.success(true);
    }

    @GetMapping("/tag_category")
    public BaseResponse<PictureTagCategory> listPictureTagCategory() {
        PictureTagCategory pictureTagCategory = new PictureTagCategory();
        List<String> tagList = Arrays.asList("热门", "生活", "高清", "游戏", "影视", "汽车", "运动", "科技", "动物", "美女", "食物", "建筑", "自然", "其他");
        List<String> categoryList = Arrays.asList("模板", "电商", "表情包", "UI", "LOGO", "壁纸", "头像", "其他");
        pictureTagCategory.setTagList(tagList);
        pictureTagCategory.setCategoryList(categoryList);
        return ResultUtils.success(pictureTagCategory);
    }

    /**
     * 点赞/取消点赞
     *
     * @param pictureId
     * @param request
     * @return
     */
    @PostMapping("/like")
    public BaseResponse<Boolean> doPictureLike(@RequestParam("id") Long pictureId, HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        if (pictureId == null || pictureId <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片ID不能为空");
        }
        boolean result = pictureLikeService.doPictureLike(pictureId, loginUser);
        return ResultUtils.success(result);
    }

    /**
     * 检查是否已点赞
     *
     * @param pictureId
     * @param request
     * @return
     */
    @GetMapping("/like/check")
    public BaseResponse<Boolean> checkPictureLike(@RequestParam long pictureId, HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        boolean result = pictureLikeService.checkPictureLike(pictureId, loginUser);
        return ResultUtils.success(result);
    }

    /**
     * 【管理员接口】审核图片
     */
    @PostMapping("/review")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> doPictureReview(@RequestBody PictureReviewRequest pictureReviewRequest,
                                                 HttpServletRequest request) {
        ThrowUtils.throwIf(pictureReviewRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(request);
        pictureService.doPictureReview(pictureReviewRequest, loginUser);
        return ResultUtils.success(true);
    }

    /**
     * 【管理员接口】批量上传图片
     */
    @PostMapping("/upload/batch")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Integer> uploadPictureByBatch(
            @RequestBody PictureUploadByBatchRequest pictureUploadByBatchRequest,
            HttpServletRequest request
    ) {
        ThrowUtils.throwIf(pictureUploadByBatchRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(request);
        int uploadCount = pictureService.uploadPictureByBatch(pictureUploadByBatchRequest, loginUser);
        return ResultUtils.success(uploadCount);
    }

}
