package com.zn.nanpicturebackend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zn.nanpicturebackend.mapper.PictureLikeMapper;
import com.zn.nanpicturebackend.mapper.PictureMapper;
import com.zn.nanpicturebackend.model.entity.Picture;
import com.zn.nanpicturebackend.model.entity.PictureLike;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.service.PictureLikeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;

/**
 * 图片点赞服务实现
 */
@Service
@Slf4j
public class PictureLikeServiceImpl extends ServiceImpl<PictureLikeMapper, PictureLike> implements PictureLikeService {

    @Resource
    private PictureMapper pictureMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean doPictureLike(long pictureId, User loginUser) {
        log.info("User {} liking picture {}", loginUser.getId(), pictureId);

        try {
            // 查询当前点赞状态（不包含逻辑删除的记录）
            QueryWrapper<PictureLike> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("pictureId", pictureId);
            queryWrapper.eq("userId", loginUser.getId());
            PictureLike existingLike = this.getOne(queryWrapper);

            if (existingLike != null) {
                // 已点赞，取消点赞（物理删除，避免唯一约束冲突）
                this.baseMapper.physicalDelete(pictureId, loginUser.getId());
                // 点赞数减1
                Picture picture = pictureMapper.selectById(pictureId);
                if (picture != null) {
                    int newCount = Math.max(0, (picture.getLikeCount() != null ? picture.getLikeCount() : 0) - 1);
                    picture.setLikeCount(newCount);
                    pictureMapper.updateById(picture);
                }
                log.info("User {} unliked picture {}", loginUser.getId(), pictureId);
                return false;
            } else {
                // 未点赞，先强制物理删除可能存在的残留记录（避免唯一约束冲突）
                this.baseMapper.physicalDelete(pictureId, loginUser.getId());

                // 添加点赞
                PictureLike pictureLike = new PictureLike();
                pictureLike.setPictureId(pictureId);
                pictureLike.setUserId(loginUser.getId());
                this.save(pictureLike);

                // 点赞数加1
                Picture picture = pictureMapper.selectById(pictureId);
                if (picture != null) {
                    int newCount = (picture.getLikeCount() != null ? picture.getLikeCount() : 0) + 1;
                    picture.setLikeCount(newCount);
                    pictureMapper.updateById(picture);
                }
                log.info("User {} liked picture {}", loginUser.getId(), pictureId);
                return true;
            }
        } catch (Exception e) {
            log.error("Error in doPictureLike: pictureId={}, userId={}", pictureId, loginUser.getId(), e);
            throw e;
        }
    }

    @Override
    public boolean checkPictureLike(long pictureId, User loginUser) {
        QueryWrapper<PictureLike> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("pictureId", pictureId);
        queryWrapper.eq("userId", loginUser.getId());
        return this.count(queryWrapper) > 0;
    }

    @Override
    public long getPictureLikeCount(long pictureId) {
        QueryWrapper<PictureLike> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("pictureId", pictureId);
        return this.count(queryWrapper);
    }
}