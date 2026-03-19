package com.zn.nanpicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.zn.nanpicturebackend.model.dto.user.UserQueryRequest;
import com.zn.nanpicturebackend.model.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zn.nanpicturebackend.model.vo.LoginUserVO;
import com.zn.nanpicturebackend.model.vo.UserVO;
import org.springframework.stereotype.Service;

import javax.management.Query;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * @author 张楠
 * @description 针对表【user(用户)】的数据库操作Service
 * @createDate 2025-11-25 21:18:00
 */

public interface UserService extends IService<User> {

    /**
     * 用户注册
     *
     * @param userAccount   用户账户
     * @param userPassword  用户密码
     * @param checkPassword 校验密码
     * @return 新用户 id
     */
    long userRegister(String userAccount, String userPassword, String checkPassword);

    /**
     * 用户登录
     *
     * @param userAccount  用户账户
     * @param userPassword 用户密码
     * @param request      请求
     * @return 登录用户信息
     */
    LoginUserVO userLogin(String userAccount, String userPassword, HttpServletRequest request);

    /**
     * 获取当前登录用户
     *
     * @param request
     * @return
     */
    User getLoginUser(HttpServletRequest request);

    //获取加密密码
    String getEncryptPassword(String userPassword);

    //获取脱敏后的登录用户信息
    LoginUserVO getLoginUserVO(User user);

    //获取脱敏后的用户信息
    UserVO getUserVO(User user);

    //获取脱敏后的用户列表
    List<UserVO> getUserVOList(List<User> userList);

    //用户退出
    Boolean userLogout(HttpServletRequest request);

    //获取查询条件
    QueryWrapper<User> getQueryWrapper(UserQueryRequest userQueryRequest);

    //是否为管理员
    boolean isAdmin(User user);

    //物理删除用户
    boolean removeUserById(Long id);

}
