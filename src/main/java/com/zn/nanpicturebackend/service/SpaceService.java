package com.zn.nanpicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zn.nanpicturebackend.model.dto.space.SpaceAddRequest;
import com.zn.nanpicturebackend.model.dto.space.SpaceQueryRequest;
import com.zn.nanpicturebackend.model.entity.Space;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.model.vo.SpaceVO;

import javax.servlet.http.HttpServletRequest;

/**
* @author 张楠
* @description 针对表【space(空间)】的数据库操作Service
* @createDate 2026-04-20 21:47:26
*/
public interface SpaceService extends IService<Space> {
    /**
     * 添加空间
     *
     * @param spaceAddRequest
     * @param loginUser
     * @return
     */
    long addSpace(SpaceAddRequest spaceAddRequest,User loginUser);

    /**
     * 校验空间
     *
     * @param space
     */
    void validSpace(Space space, boolean add);

    /**
     * 获取空间封装类
     *
     * @param space
     * @param request
     * @return
     */
    SpaceVO getSpaceVO(Space space, HttpServletRequest request);

    /**
     * 获取空间分页封装类
     *
     * @param spacePage
     * @param request
     * @return
     */
    Page<SpaceVO> getSpaceVOPage(Page<Space> spacePage, HttpServletRequest request);

    //获取查询条件
    QueryWrapper<Space> getQueryWrapper(SpaceQueryRequest spaceQueryRequest);

    /**
     * 根据空间等级填充空间
     *
     * @param space
     */
    public void fillSpaceBySpaceLevel(Space space);
}
