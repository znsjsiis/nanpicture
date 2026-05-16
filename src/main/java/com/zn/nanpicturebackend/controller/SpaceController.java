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
import com.zn.nanpicturebackend.model.dto.space.*;
import com.zn.nanpicturebackend.model.entity.Space;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.model.enums.SpaceLevelEnum;
import com.zn.nanpicturebackend.model.vo.SpaceVO;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/space")
@Slf4j
public class SpaceController {

    @Resource
    private SpaceService spaceService;
    @Resource
    private UserService userService;

    @PostMapping("/add")
    public BaseResponse<Long> addSpace(@RequestBody SpaceAddRequest spaceAddRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(spaceAddRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(request);
        long newId = spaceService.addSpace(spaceAddRequest, loginUser);
        return ResultUtils.success(newId);
    }

    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteSpace(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        Long id = deleteRequest.getId();
        // 判断是否存在
        Space oldSpace = spaceService.getById(id);
        //仅本人或管理员可删除
        if (!oldSpace.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }
        boolean result = spaceService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }


    /**
     * 【管理员接口】更新空间信息
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE) // 假设@AuthCheck是自定义权限注解
    public BaseResponse<Boolean> updateSpace(@RequestBody SpaceUpdateRequest spaceUpdateRequest,
                                               HttpServletRequest request) {
        // 1. 参数校验：请求体或ID为空则抛参数错误
        if (spaceUpdateRequest == null || spaceUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        // 2. 复制请求参数到Space实体
        Space space = new Space();
        BeanUtils.copyProperties(spaceUpdateRequest, space); // 需确保BeanUtils导入（如org.springframework.beans.BeanUtils）
        //自动填充数据
        spaceService.fillSpaceBySpaceLevel(space);
        spaceService.validSpace(space, false);
        // 5. 校验原空间是否存在
        Long id = spaceUpdateRequest.getId();
        Space oldSpace = spaceService.getById(id);
        ThrowUtils.throwIf(oldSpace == null, ErrorCode.NOT_FOUND_ERROR); // 假设ThrowUtils是自定义工具类
        // 6. 执行更新操作
        boolean result = spaceService.updateById(space);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR); // 注意：原代码是throwIf(result, ...)，逻辑错误，应是!result
        // 7. 返回成功结果
        return ResultUtils.success(true);
    }


    /**
     * 【管理员接口】根据ID获取空间实体
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Space> getSpaceById(Long id, HttpServletRequest request) {
        // 参数校验：ID<=0则抛错
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);

        // 查询空间
        Space space = spaceService.getById(id);
        ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR);

        // 返回结果
        return ResultUtils.success(space);
    }


    /**
     * 根据ID获取空间VO（视图对象）
     */
    @GetMapping("/get/vo")
    public BaseResponse<SpaceVO> getSpaceVOById(Long id, HttpServletRequest request) {
        // 参数校验
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        // 查询空间实体
        Space space = spaceService.getById(id);
        ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR);
        // 转换为VO并返回（由Service实现实体转VO）
        return ResultUtils.success(spaceService.getSpaceVO(space, request));
    }


    /**
     * 【管理员接口】分页查询空间列表
     */
    @PostMapping("/list/page")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<Space>> listSpaceByPage(@RequestBody SpaceQueryRequest spaceQueryRequest) {
        // 获取分页参数
        long current = spaceQueryRequest.getCurrent();
        long size = spaceQueryRequest.getPageSize();

        // 构建分页对象+查询条件，执行分页查询
        Page<Space> spacePage = spaceService.page(
                new Page<>(current, size),
                spaceService.getQueryWrapper(spaceQueryRequest) // 由Service实现查询条件构造
        );

        // 返回分页结果
        return ResultUtils.success(spacePage);
    }

    /**
     * 分页查询空间VO列表
     */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<SpaceVO>> listSpaceVOPage(
            @RequestBody SpaceQueryRequest spaceQueryRequest,
            HttpServletRequest request) {
        // 1. 获取分页参数
        long current = spaceQueryRequest.getCurrent();
        long size = spaceQueryRequest.getPageSize();
        // 2. 限制每页最大条数（避免请求过大）
        ThrowUtils.throwIf(size > 20, ErrorCode.PARAMS_ERROR);
        // 3. 执行空间分页查询
        Page<Space> spacePage = spaceService.page(
                new Page<>(current, size),
                spaceService.getQueryWrapper(spaceQueryRequest)
        );

        // 4. 转换为SpaceVO分页并返回
        return ResultUtils.success(spaceService.getSpaceVOPage(spacePage, request));
    }


    /**
     * 【编辑空间信息】
     * 注：仅空间所属用户可编辑
     */
    @PostMapping("/edit")
    public BaseResponse<Boolean> editSpace(
            @RequestBody SpaceEditRequest spaceEditRequest,
            HttpServletRequest request) {
        // 1. 参数校验
        if (spaceEditRequest == null || spaceEditRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        // 2. 复制请求参数到实体
        Space space = new Space();
        BeanUtils.copyProperties(spaceEditRequest, space);
        //自动填充数据
        spaceService.fillSpaceBySpaceLevel(space);
        // 设置编辑时间
        space.setEditTime(new Date());
        // 3. 实体合法性校验
        spaceService.validSpace(space,false);
        // 4. 获取当前登录用户，校验权限
        User loginUser = userService.getLoginUser(request);

        Long spaceId = spaceEditRequest.getId();
        Space oldSpace = spaceService.getById(spaceId);
        ThrowUtils.throwIf(oldSpace == null, ErrorCode.NOT_FOUND_ERROR);
        //仅本人或管理员可以编辑
        if (!oldSpace.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
        }

        // 5. 执行更新
        boolean result = spaceService.updateById(space);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);

        return ResultUtils.success(true);
    }

    /**
     * 获取空间等级列表
     */
    @GetMapping("/list/level")
    public BaseResponse<List<SpaceLevel>> listSpaceLevel() {
        List<SpaceLevel> spaceLevelList = Arrays.stream(SpaceLevelEnum.values())
                .map(spaceLevelEnum -> new SpaceLevel(
                        spaceLevelEnum.getValue(),
                        spaceLevelEnum.getText(),
                        spaceLevelEnum.getMaxCount(),
                        spaceLevelEnum.getMaxSize()))
                .collect(Collectors.toList());
        return ResultUtils.success(spaceLevelList);
    }

}
